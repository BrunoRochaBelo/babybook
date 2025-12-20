"""Add child_id to assets for child-centric quota attribution

Revision ID: 0005_assets_child_id
Revises: 0004_child_pce_credit_ledger
Create Date: 2025-12-17

Rationale:
- To enforce child-centric storage quota we need to attribute uploaded bytes to a Child.
- Existing rows remain NULL for backwards compatibility.
"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0005_assets_child_id"
down_revision = "0004_child_pce_credit_ledger"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "assets",
        sa.Column(
            "child_id",
            sa.Uuid(),
            nullable=True,
            comment="Optional Child attribution for this asset (for child-centric quota)",
        ),
    )
    op.create_foreign_key(
        "fk_assets_child_id",
        source_table="assets",
        referent_table="children",
        local_cols=["child_id"],
        remote_cols=["id"],
        ondelete="SET NULL",
    )

    # Fast lookups for quota computation.
    op.create_index("ix_assets_account_child", "assets", ["account_id", "child_id"])


def downgrade() -> None:
    op.drop_index("ix_assets_account_child", table_name="assets")
    op.drop_constraint("fk_assets_child_id", "assets", type_="foreignkey")
    op.drop_column("assets", "child_id")
