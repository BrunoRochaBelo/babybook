"""Add 'not_required' to delivery credit status enum

Revision ID: 0007_delivery_credit_not_required
Revises: 0006_assets_unique_child_sha
Create Date: 2025-12-17

Golden Record:
- Allows partner deliveries that don't require a credit (client already has access).
- Enables "voucher só quando necessário" by supporting a direct-import flow.

"""

from __future__ import annotations

from alembic import op


# revision identifiers, used by Alembic.
revision = "0007_delivery_credit_not_required"
down_revision = "0006_assets_unique_child_sha"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    # Postgres ENUM needs explicit ALTER TYPE.
    if dialect == "postgresql":
        op.execute("ALTER TYPE delivery_credit_status_enum ADD VALUE IF NOT EXISTS 'not_required'")


def downgrade() -> None:
    # Downgrading a Postgres ENUM value is non-trivial (requires creating a new type
    # and casting). We intentionally leave downgrade as a no-op.
    pass
