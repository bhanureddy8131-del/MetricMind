"""Dataset upload and management endpoints."""

import io
import json
import re
from pathlib import Path

import pandas as pd

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.routes import get_current_user
from app.database import engine, get_db
from app.models import Dataset, User


router = APIRouter(
    prefix="/datasets",
    tags=["Datasets"],
)


MAX_FILE_SIZE = 50 * 1024 * 1024


ALLOWED_EXTENSIONS = {
    ".csv": "csv",
    ".xlsx": "xlsx",
    ".xls": "xls",
}


ALLOWED_CONTENT_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
    "",
}


def dataset_response(dataset: Dataset):
    return {
        "id": dataset.id,
        "name": dataset.name,
        "original_filename": dataset.original_filename,
        "file_type": dataset.file_type,
        "row_count": dataset.row_count,
        "column_count": dataset.column_count,
        "columns": json.loads(dataset.columns),
        "table_name": dataset.table_name,
        "upload_status": dataset.upload_status,
        "uploaded_at": (
            dataset.uploaded_at.isoformat()
            if dataset.uploaded_at
            else None
        ),
        "is_active": dataset.is_active,
    }


def clean_columns(columns):
    cleaned = []
    used = set()

    for index, column in enumerate(
        columns,
        start=1,
    ):
        name = re.sub(
            r"[^a-zA-Z0-9]+",
            "_",
            str(column).strip(),
        ).strip("_").lower()

        if not name:
            name = f"column_{index}"

        if name[0].isdigit():
            name = f"column_{name}"

        base_name = name
        counter = 2

        while name in used:
            name = f"{base_name}_{counter}"
            counter += 1

        used.add(name)
        cleaned.append(name)

    return cleaned


async def read_upload(file: UploadFile):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    extension = Path(
        file.filename
    ).suffix.lower()

    file_type = ALLOWED_EXTENSIONS.get(
        extension
    )

    if not file_type:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only CSV, XLSX and XLS "
                "files are supported."
            ),
        )

    content_type = (
        file.content_type or ""
    )

    if content_type not in ALLOWED_CONTENT_TYPES:
        print(
            f"Warning: unusual content type: "
            f"{content_type}"
        )

    content = await file.read(
        MAX_FILE_SIZE + 1
    )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=(
                "Dataset exceeds the "
                "50 MB limit."
            ),
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty.",
        )

    return content, file_type


def parse_dataset(
    content: bytes,
    file_type: str,
):
    try:

        if file_type == "csv":

            try:
                frame = pd.read_csv(
                    io.BytesIO(content)
                )

            except UnicodeDecodeError:

                frame = pd.read_csv(
                    io.BytesIO(content),
                    encoding="latin1",
                )

        elif file_type == "xlsx":

            frame = pd.read_excel(
                io.BytesIO(content),
                engine="openpyxl",
            )

        elif file_type == "xls":

            frame = pd.read_excel(
                io.BytesIO(content),
                engine="xlrd",
            )

        else:
            raise HTTPException(
                status_code=400,
                detail="Unsupported dataset format.",
            )

    except HTTPException:
        raise

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=(
                f"Unable to read dataset: "
                f"{error}"
            ),
        )

    if frame.empty:
        raise HTTPException(
            status_code=400,
            detail=(
                "Dataset contains no data."
            ),
        )

    if len(frame.columns) == 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Dataset contains no columns."
            ),
        )

    frame.columns = clean_columns(
        frame.columns
    )

    frame = frame.dropna(
        axis="columns",
        how="all",
    )

    if frame.shape[1] == 0:
        raise HTTPException(
            status_code=400,
            detail=(
                "Dataset contains no usable columns."
            ),
        )

    return frame


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Upload CSV/XLSX/XLS dataset.
    """

    del current_user

    content, file_type = (
        await read_upload(file)
    )

    original_filename = Path(
        file.filename
    ).name

    frame = parse_dataset(
        content,
        file_type,
    )

    dataset = Dataset(
        name=Path(
            original_filename
        ).stem[:255],

        original_filename=(
            original_filename[:255]
        ),

        file_type=file_type,

        row_count=len(frame.index),

        column_count=len(frame.columns),

        columns=json.dumps(
            list(frame.columns)
        ),

        table_name="pending",

        upload_status="processing",

        is_active=False,
    )

    db.add(dataset)
    db.flush()

    table_name = (
        f"dataset_{dataset.id}"
    )

    dataset.table_name = table_name

    db.commit()

    try:

        # Store uploaded dataframe
        frame.to_sql(
            table_name,
            engine,
            if_exists="fail",
            index=False,
        )

        dataset = db.get(
            Dataset,
            dataset.id,
        )

        if dataset is None:
            raise Exception(
                "Dataset metadata was lost."
            )

        dataset.upload_status = (
            "completed"
        )

        db.commit()
        db.refresh(dataset)

    except Exception as error:

        db.rollback()

        # Try removing metadata
        failed_dataset = db.get(
            Dataset,
            dataset.id,
        )

        if failed_dataset:
            db.delete(
                failed_dataset
            )
            db.commit()

        # Try removing uploaded table
        try:

            with engine.begin() as connection:

                connection.execute(
                    text(
                        f'DROP TABLE IF EXISTS '
                        f'"{table_name}"'
                    )
                )

        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=(
                f"Unable to store dataset: "
                f"{error}"
            ),
        )

    finally:

        await file.close()

    return {
        "success": True,
        "message": (
            "Dataset uploaded successfully."
        ),
        "dataset": dataset_response(
            dataset
        ),
    }


@router.get("")
def list_datasets(
    db: Session = Depends(get_db),
):
    datasets = (
        db.query(Dataset)
        .order_by(
            Dataset.uploaded_at.desc()
        )
        .all()
    )

    return {
        "success": True,
        "datasets": [
            dataset_response(dataset)
            for dataset in datasets
        ],
    }


@router.get("/active")
def active_dataset(
    db: Session = Depends(get_db),
):
    dataset = (
        db.query(Dataset)
        .filter(
            Dataset.is_active.is_(True)
        )
        .first()
    )

    return {
        "success": True,
        "dataset": (
            dataset_response(dataset)
            if dataset
            else None
        ),
    }


@router.get("/{dataset_id}")
def get_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
):
    dataset = db.get(
        Dataset,
        dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    return {
        "success": True,
        "dataset": dataset_response(
            dataset
        ),
    }


@router.post("/{dataset_id}/activate")
def activate_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    del current_user

    dataset = db.get(
        Dataset,
        dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    if dataset.upload_status != "completed":
        raise HTTPException(
            status_code=400,
            detail=(
                "Dataset is not ready "
                "for activation."
            ),
        )

    # Deactivate all other datasets
    db.query(Dataset).update(
        {
            Dataset.is_active: False
        },
        synchronize_session=False,
    )

    dataset.is_active = True

    db.commit()
    db.refresh(dataset)

    return {
        "success": True,
        "message": (
            "Dataset activated successfully."
        ),
        "dataset": dataset_response(
            dataset
        ),
    }


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    del current_user

    dataset = db.get(
        Dataset,
        dataset_id,
    )

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    if dataset.is_active:
        raise HTTPException(
            status_code=400,
            detail=(
                "Deactivate the dataset "
                "before deleting it."
            ),
        )

    table_name = dataset.table_name

    db.delete(dataset)
    db.commit()

    try:

        with engine.begin() as connection:

            connection.execute(
                text(
                    f'DROP TABLE IF EXISTS '
                    f'"{table_name}"'
                )
            )

    except Exception as error:

        print(
            f"Warning: unable to drop "
            f"dataset table: {error}"
        )

    return {
        "success": True,
        "message": (
            "Dataset deleted successfully."
        ),
    }