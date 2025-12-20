"""Make asset sha256 uniqueness child-scoped

Revision ID: 0006_assets_unique_child_sha
Revises: 0005_assets_child_id
Create Date: 2025-12-17

Rationale:
- With child-centric storage, an asset must be attributable to exactly one Child.
- Dedup/uniqueness by sha256 must not accidentally "share" an Asset across Children,
  otherwise quota attribution becomes incorrect.

This migration changes the unique constraint from (account_id, sha256)
into (account_id, child_id, sha256).
"""

from __future__ import annotations

from alembic import op

# revision identifiers, used by Alembic.
revision = "0006_assets_unique_child_sha"
down_revision = "0005_assets_child_id"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint("uq_asset_account_sha256", "assets", type_="unique")
    op.create_unique_constraint(
        "uq_asset_account_child_sha256",
        "assets",
        ["account_id", "child_id", "sha256"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_asset_account_child_sha256", "assets", type_="unique")
    op.create_unique_constraint(
        "uq_asset_account_sha256",
        "assets",
        ["account_id", "sha256"],
    )
