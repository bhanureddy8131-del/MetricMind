from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from datetime import date
from typing import Optional
import sqlite3
import os


router = APIRouter(
    prefix="/data",
    tags=["Data Entry"],
)


# ---------------------------------------------------------
# Database location
# ---------------------------------------------------------

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DB_PATH = os.path.join(
    BASE_DIR,
    "metricmind.db"
)


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


# ---------------------------------------------------------
# Create table
# ---------------------------------------------------------

def create_table():
    connection = get_connection()

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS business_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            order_id TEXT NOT NULL,
            order_date TEXT NOT NULL,
            customer_name TEXT NOT NULL,

            region TEXT NOT NULL,
            state TEXT,
            city TEXT,

            category TEXT NOT NULL,
            sub_category TEXT,
            product_name TEXT NOT NULL,

            sales REAL NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 1,
            discount REAL NOT NULL DEFAULT 0,
            profit REAL NOT NULL DEFAULT 0,

            payment_method TEXT,
            shipping_mode TEXT,

            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )

    connection.commit()
    connection.close()


create_table()


# ---------------------------------------------------------
# Data model
# ---------------------------------------------------------

class BusinessDataCreate(BaseModel):

    order_id: str = Field(..., min_length=1)

    order_date: date

    customer_name: str = Field(
        ...,
        min_length=1
    )

    region: str

    state: Optional[str] = None

    city: Optional[str] = None

    category: str

    sub_category: Optional[str] = None

    product_name: str

    sales: float = 0

    quantity: int = 1

    discount: float = 0

    profit: float = 0

    payment_method: Optional[str] = None

    shipping_mode: Optional[str] = None


# ---------------------------------------------------------
# ADD DATA
# ---------------------------------------------------------

@router.post("")
def add_business_data(
    data: BusinessDataCreate
):

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            INSERT INTO business_data (
                order_id,
                order_date,
                customer_name,
                region,
                state,
                city,
                category,
                sub_category,
                product_name,
                sales,
                quantity,
                discount,
                profit,
                payment_method,
                shipping_mode
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                data.order_id,
                str(data.order_date),
                data.customer_name,
                data.region,
                data.state,
                data.city,
                data.category,
                data.sub_category,
                data.product_name,
                data.sales,
                data.quantity,
                data.discount,
                data.profit,
                data.payment_method,
                data.shipping_mode,
            )
        )

        connection.commit()

        return {
            "success": True,
            "message": "Data added successfully",
            "id": cursor.lastrowid,
            "order_id": data.order_id,
        }

    except Exception as error:

        connection.rollback()

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )

    finally:

        connection.close()


# ---------------------------------------------------------
# GET ALL DATA
# ---------------------------------------------------------

@router.get("")
def get_business_data():

    connection = get_connection()

    try:

        rows = connection.execute(
            """
            SELECT *
            FROM business_data
            ORDER BY id DESC
            """
        ).fetchall()

        return {
            "success": True,
            "total": len(rows),
            "data": [
                dict(row)
                for row in rows
            ],
        }

    finally:

        connection.close()


# ---------------------------------------------------------
# DELETE DATA
# ---------------------------------------------------------

@router.delete("/{data_id}")
def delete_business_data(
    data_id: int
):

    connection = get_connection()

    try:

        cursor = connection.execute(
            """
            DELETE FROM business_data
            WHERE id = ?
            """,
            (data_id,)
        )

        connection.commit()

        if cursor.rowcount == 0:

            raise HTTPException(
                status_code=404,
                detail="Data record not found"
            )

        return {
            "success": True,
            "message": "Data deleted successfully",
        }

    finally:

        connection.close()