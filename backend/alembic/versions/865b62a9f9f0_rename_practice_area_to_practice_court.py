"""rename practice_area to practice_court

Revision ID: 865b62a9f9f0
Revises: 4c2417c1ca90
Create Date: 2026-07-16 11:09:17.057775
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "865b62a9f9f0"
down_revision: Union[str, None] = "4c2417c1ca90"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "advocates",
        "practice_area",
        new_column_name="practice_court",
        existing_type=sa.String(length=255),
    )

    op.alter_column(
        "assigned_cases",
        "practice_area",
        new_column_name="practice_court",
        existing_type=sa.String(length=255),
    )


def downgrade() -> None:
    op.alter_column(
        "advocates",
        "practice_court",
        new_column_name="practice_area",
        existing_type=sa.String(length=255),
    )

    op.alter_column(
        "assigned_cases",
        "practice_court",
        new_column_name="practice_area",
        existing_type=sa.String(length=255),
    )