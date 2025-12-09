"""Add billing breakdown fields

Revision ID: 0002_billing_breakdown
Revises: 0001_b2b2c_media_assets
Create Date: 2025-12-09
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "0002_billing_breakdown"
down_revision = "0001_b2b2c_media_assets"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("billing_events", sa.Column("amount_gross", sa.Integer(), nullable=True))
    op.add_column("billing_events", sa.Column("gateway_fee", sa.Integer(), nullable=True))
    op.add_column("billing_events", sa.Column("pce_reserved", sa.Integer(), nullable=True))
    op.add_column("billing_events", sa.Column("tax_effective", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("billing_events", "tax_effective")
    op.drop_column("billing_events", "pce_reserved")
    op.drop_column("billing_events", "gateway_fee")
    op.drop_column("billing_events", "amount_gross")
