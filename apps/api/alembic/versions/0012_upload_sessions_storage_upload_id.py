"""Add storage_upload_id to upload_sessions

Revision ID: 0012
Revises: 0011_user_notifications_preferences
Create Date: 2026-01-02

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0012_upload_sessions_storage_upload_id"
down_revision: Union[str, None] = "0011_user_notifications_preferences"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "upload_sessions",
        sa.Column("storage_upload_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("upload_sessions", "storage_upload_id")
