"""Add deliveries indexes for partner list filters

Revision ID: 0009_delivery_list_filter_indexes
Revises: 0008_delivery_target_email
Create Date: 2025-12-19

Adds composite indexes to keep the partner deliveries list responsive when
filtering by voucher/resgate/arquivadas.

"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0009_delivery_list_filter_indexes"
down_revision = "0008_delivery_target_email"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_deliveries_partner_generated_voucher_code",
        "deliveries",
        ["partner_id", "generated_voucher_code"],
        unique=False,
    )
    op.create_index(
        "ix_deliveries_partner_assets_transferred_at",
        "deliveries",
        ["partner_id", "assets_transferred_at"],
        unique=False,
    )
    op.create_index(
        "ix_deliveries_partner_archived_at",
        "deliveries",
        ["partner_id", "archived_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_deliveries_partner_archived_at",
        table_name="deliveries",
    )
    op.drop_index(
        "ix_deliveries_partner_assets_transferred_at",
        table_name="deliveries",
    )
    op.drop_index(
        "ix_deliveries_partner_generated_voucher_code",
        table_name="deliveries",
    )
