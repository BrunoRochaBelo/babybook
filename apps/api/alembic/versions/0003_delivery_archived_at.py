"""Add archived_at column to deliveries table

Revision ID: 0003_delivery_archived_at
Revises: 0002_billing_breakdown
Create Date: 2025-12-13

This migration adds the archived_at column to the deliveries table.
This column is used for soft-delete functionality - when a photographer
archives a delivery, only their view is affected. The client continues
to have access to their photos.

Security considerations:
- Column is nullable (no default value needed)
- Only affects photographer's view, not client access
- Index added for efficient filtering of non-archived deliveries
"""
from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0003_delivery_archived_at"
down_revision = "0002_billing_breakdown"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add archived_at column to deliveries table
    op.add_column(
        "deliveries",
        sa.Column(
            "archived_at",
            sa.DateTime(timezone=True),
            nullable=True,
            comment="Timestamp when photographer archived this delivery (soft delete)"
        )
    )
    
    # Add partial index for efficient filtering of non-archived deliveries
    # This optimizes the common case of listing only active deliveries
    op.create_index(
        "ix_deliveries_partner_not_archived",
        "deliveries",
        ["partner_id"],
        postgresql_where=sa.text("archived_at IS NULL")
    )


def downgrade() -> None:
    # Remove index first
    op.drop_index("ix_deliveries_partner_not_archived", table_name="deliveries")
    
    # Remove column
    op.drop_column("deliveries", "archived_at")
