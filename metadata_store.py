"""
METADATA STORE — PostgreSQL version

Shared metadata database for:
- Gateway
- Repair Checker

DATABASE_URL Render environment variable se aayega.
"""

import os
import json
import psycopg2
from psycopg2.extras import Json
from contextlib import contextmanager


DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")


@contextmanager
def get_connection():
    conn = psycopg2.connect(DATABASE_URL)

    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """
    Metadata table create karta hai agar pehle se exist nahi karti.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS file_metadata (
                    file_id TEXT PRIMARY KEY,
                    target_nodes JSONB NOT NULL,
                    confirmed_nodes JSONB NOT NULL,
                    checksum TEXT NOT NULL,
                    timestamp DOUBLE PRECISION NOT NULL,
                    replication_factor INTEGER NOT NULL
                )
            """)


def register_file(
    file_id: str,
    nodes: list,
    confirmed_nodes: list,
    checksum: str,
    timestamp: float
):
    """
    Upload ke time file ka metadata PostgreSQL mein save karta hai.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                INSERT INTO file_metadata (
                    file_id,
                    target_nodes,
                    confirmed_nodes,
                    checksum,
                    timestamp,
                    replication_factor
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (file_id)
                DO UPDATE SET
                    target_nodes = EXCLUDED.target_nodes,
                    confirmed_nodes = EXCLUDED.confirmed_nodes,
                    checksum = EXCLUDED.checksum,
                    timestamp = EXCLUDED.timestamp,
                    replication_factor = EXCLUDED.replication_factor
            """, (
                file_id,
                Json(nodes),
                Json(confirmed_nodes),
                checksum,
                timestamp,
                len(nodes)
            ))


def get_file_info(file_id: str):
    """
    Ek file ka complete metadata return karta hai.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    file_id,
                    target_nodes,
                    confirmed_nodes,
                    checksum,
                    timestamp,
                    replication_factor
                FROM file_metadata
                WHERE file_id = %s
            """, (file_id,))

            row = cur.fetchone()

            if not row:
                return None

            return {
                "target_nodes": row[1],
                "confirmed_nodes": row[2],
                "checksum": row[3],
                "timestamp": row[4],
                "replication_factor": row[5]
            }


def get_all_files():
    """
    Database mein stored saari files ka metadata return karta hai.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                SELECT
                    file_id,
                    target_nodes,
                    confirmed_nodes,
                    checksum,
                    timestamp,
                    replication_factor
                FROM file_metadata
            """)

            rows = cur.fetchall()

            data = {}

            for row in rows:
                file_id = row[0]

                data[file_id] = {
                    "target_nodes": row[1],
                    "confirmed_nodes": row[2],
                    "checksum": row[3],
                    "timestamp": row[4],
                    "replication_factor": row[5]
                }

            return data


def update_confirmed_nodes(file_id: str, confirmed_nodes: list):
    """
    Repair ke baad confirmed nodes update karta hai.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                UPDATE file_metadata
                SET confirmed_nodes = %s
                WHERE file_id = %s
            """, (
                Json(confirmed_nodes),
                file_id
            ))


def delete_file_record(file_id: str):
    """
    File delete hone par metadata bhi delete karta hai.
    """

    with get_connection() as conn:
        with conn.cursor() as cur:

            cur.execute("""
                DELETE FROM file_metadata
                WHERE file_id = %s
            """, (file_id,))


# Database/table startup par automatically create ho jayegi
init_db()