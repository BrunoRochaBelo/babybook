"""Add deliveries.target_email

Revision ID: 0008_delivery_target_email
Revises: 0007_delivery_credit_not_req
Create Date: 2025-12-19

Adds hard-lock email field for direct deliveries.

"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0008_delivery_target_email"
down_revision = "0007_delivery_credit_not_req"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "deliveries",
        sa.Column("target_email", sa.String(length=180), nullable=True),
    )
    op.create_index(
        "ix_deliveries_target_email",
        "deliveries",
        ["target_email"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_deliveries_target_email", table_name="deliveries")
    op.drop_column("deliveries", "target_email")
