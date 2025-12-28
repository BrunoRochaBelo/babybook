"""Add deliveries.target_child_id

Revision ID: 0010_delivery_target_child_id
Revises: 0009_delivery_list_filter_indexes
Create Date: 2025-12-28

Adds an optional link from a partner delivery to a specific Child (Livro).
This enables child-aware deliveries when a responsible has multiple children.

"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "0010_delivery_target_child_id"
down_revision = "0009_delivery_list_filter_indexes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "deliveries",
        sa.Column(
            "target_child_id",
            sa.Uuid(),
            nullable=True,
            comment="Optional target Child (Livro) for direct import deliveries",
        ),
    )
    op.create_foreign_key(
        "fk_deliveries_target_child_id",
        source_table="deliveries",
        referent_table="children",
        local_cols=["target_child_id"],
        remote_cols=["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_deliveries_target_child_id",
        "deliveries",
        ["target_child_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_deliveries_target_child_id", table_name="deliveries")
    op.drop_constraint("fk_deliveries_target_child_id", "deliveries", type_="foreignkey")
    op.drop_column("deliveries", "target_child_id")
