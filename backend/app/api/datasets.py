"""Authenticated dataset upload and lifecycle endpoints."""

import io
import json
import re
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.routes import get_current_user
from app.database import engine, get_db
from app.models import Dataset, User

router = APIRouter(prefix="/datasets", tags=["Datasets"])

MAX_FILE_SIZE = 50 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv": "csv", ".xlsx": "xlsx", ".xls": "xls"}
ALLOWED_CONTENT_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
}


def _dataset_response(dataset: Dataset) -> dict:
    return {
        "id": dataset.id,
        "name": dataset.name,
        "original_filename": dataset.original_filename,
        "file_type": dataset.file_type,
        "row_count": dataset.row_count,
        "column_count": dataset.column_count,
        "columns": json.loads(dataset.columns),
        "upload_status": dataset.upload_status,
        "uploaded_at": dataset.uploaded_at.isoformat() if dataset.uploaded_at else None,
        "is_active": dataset.is_active,
    }


def _clean_columns(columns) -> list[str]:
    cleaned = []
    used = set()
    for index, column in enumerate(columns, start=1):
        name = re.sub(r"[^a-zA-Z0-9]+", "_", str(column).strip()).strip("_").lower()
        name = name or f"column_{index}"
        if name[0].isdigit():
            name = f"column_{name}"
        base = name
        suffix = 2
        while name in used:
            name = f"{base}_{suffix}"
            suffix += 1
        used.add(name)
        cleaned.append(name)
    return cleaned


async def _read_upload(file: UploadFile) -> tuple[bytes, str]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected.")
    extension = Path(file.filename).suffix.lower()
    file_type = ALLOWED_EXTENSIONS.get(extension)
    if not file_type:
        raise HTTPException(status_code=400, detail="Only CSV and Excel (.xlsx/.xls) files are supported.")
    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="The uploaded file type is not supported.")
    content = await file.read(MAX_FILE_SIZE + 1)
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Dataset file exceeds the 50 MB limit.")
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    return content, file_type


def _parse_dataset(content: bytes, file_type: str) -> pd.DataFrame:
    try:
        if file_type == "csv":
            frame = pd.read_csv(io.BytesIO(content))
        else:
            engine = "xlrd" if file_type == "xls" else "openpyxl"
            frame = pd.read_excel(io.BytesIO(content), engine=engine)
    except Exception as error:
        raise HTTPException(status_code=400, detail=f"Invalid {file_type.upper()} dataset: {error}")
    if len(frame.columns) == 0 or any(
        not str(column).strip() or str(column).lower().startswith("unnamed:")
        for column in frame.columns
    ):
        raise HTTPException(status_code=400, detail="The dataset must contain a header row with column names.")
    if frame.shape[0] == 0:
        raise HTTPException(status_code=400, detail="The dataset contains no data rows.")
    frame.columns = _clean_columns(frame.columns)
    frame = frame.dropna(axis="columns", how="all")
    if frame.shape[1] == 0:
        raise HTTPException(status_code=400, detail="The dataset contains no usable columns.")
    return frame


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user
    content, file_type = await _read_upload(file)
    original_filename = Path(file.filename).name
    frame = _parse_dataset(content, file_type)
    dataset = Dataset(
        name=Path(original_filename).stem[:255],
        original_filename=original_filename[:255],
        file_type=file_type,
        row_count=len(frame.index),
        column_count=len(frame.columns),
        columns=json.dumps(list(frame.columns)),
        table_name="pending",
        upload_status="processing",
        is_active=False,
    )
    db.add(dataset)
    db.flush()
    dataset.table_name = f"dataset_{dataset.id}"
    db.commit()
    try:
        frame.to_sql(dataset.table_name, engine, if_exists="fail", index=False)
        dataset = db.get(Dataset, dataset.id)
        dataset.upload_status = "completed"
        db.commit()
        db.refresh(dataset)
    except Exception as error:
        db.rollback()
        failed_dataset = db.get(Dataset, dataset.id)
        if failed_dataset:
            db.delete(failed_dataset)
            db.commit()
        with engine.begin() as connection:
            connection.execute(text(f'DROP TABLE IF EXISTS "{dataset.table_name}"'))
        raise HTTPException(status_code=500, detail=f"Unable to store dataset: {error}")
    finally:
        await file.close()
    return {"success": True, "message": "Dataset uploaded successfully", "dataset": _dataset_response(dataset)}


@router.get("")
def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(Dataset).order_by(Dataset.uploaded_at.desc()).all()
    return {"success": True, "datasets": [_dataset_response(dataset) for dataset in datasets]}


@router.get("/active")
def get_active_dataset(db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.is_active.is_(True)).first()
    return {"success": True, "dataset": _dataset_response(dataset) if dataset else None}


@router.get("/{dataset_id}")
def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return {"success": True, "dataset": _dataset_response(dataset)}


@router.post("/{dataset_id}/activate")
def activate_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    db.query(Dataset).update({Dataset.is_active: False}, synchronize_session=False)
    dataset.is_active = True
    db.commit()
    db.refresh(dataset)
    return {"success": True, "message": "Dataset activated successfully", "dataset": _dataset_response(dataset)}


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    del current_user
    dataset = db.get(Dataset, dataset_id)
    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    if dataset.is_active:
        raise HTTPException(status_code=400, detail="Deactivate the dataset before deleting it.")
    table_name = dataset.table_name
    db.delete(dataset)
    db.commit()
    with engine.begin() as connection:
        connection.execute(text(f'DROP TABLE IF EXISTS "{table_name}"'))
    return {"success": True, "message": "Dataset deleted successfully"}