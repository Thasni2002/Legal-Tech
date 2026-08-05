"""
migrate_confidential_vault.py
==============================
Adds confidential vault columns to case_management_cases and creates
the confidential_case_audit_logs table.

Run: python migrate_confidential_vault.py
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import inspect, text
from app.database import engine


def column_exists(inspector, table_name, col_name):
    try:
        cols = {c["name"] for c in inspector.get_columns(table_name)}
        return col_name in cols
    except Exception:
        return False


def run():
    inspector = inspect(engine)

    with engine.begin() as conn:

        # ─── 1. case_management_cases: add 4 vault columns ──────────────────
        case_cols = {
            "is_confidential":            "TINYINT(1) NOT NULL DEFAULT 0",
            "confidential_password_hash": "VARCHAR(255) NULL",
            "confidential_owner_id":      "INT NULL",
            "needs_password_reset":       "TINYINT(1) NOT NULL DEFAULT 0",
        }

        for col_name, col_def in case_cols.items():
            if not column_exists(inspector, "case_management_cases", col_name):
                sql = f"ALTER TABLE `case_management_cases` ADD COLUMN `{col_name}` {col_def}"
                print(f"[case_management_cases] Adding column: {col_name}")
                conn.execute(text(sql))
                print(f"  [OK] {col_name}")
            else:
                print(f"[case_management_cases] Column already exists: {col_name}")

        # ─── 2. confidential_case_audit_logs: create if missing ─────────────
        if not inspector.has_table("confidential_case_audit_logs"):
            print("\n[confidential_case_audit_logs] Creating table...")
            create_sql = """
            CREATE TABLE `confidential_case_audit_logs` (
                `id`          INT NOT NULL AUTO_INCREMENT,
                `case_id`     INT NOT NULL,
                `user_id`     INT NULL,
                `action`      VARCHAR(100) NOT NULL,
                `ip_address`  VARCHAR(50) NULL,
                `user_agent`  TEXT NULL,
                `extra_data`  JSON NULL,
                `created_at`  DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                INDEX `ix_vault_audit_case_id` (`case_id`),
                INDEX `ix_vault_audit_user_id` (`user_id`),
                CONSTRAINT `fk_vault_audit_case`
                    FOREIGN KEY (`case_id`) REFERENCES `case_management_cases`(`id`)
                    ON DELETE CASCADE,
                CONSTRAINT `fk_vault_audit_user`
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
                    ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """
            conn.execute(text(create_sql))
            print("  [OK] confidential_case_audit_logs created")
        else:
            print("\n[confidential_case_audit_logs] Table already exists.")

    print("\n✅ Confidential Vault migration completed successfully!")


if __name__ == "__main__":
    run()
