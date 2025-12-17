"""Child-centric PCE/quota + delivery credit lifecycle + partner ledger

Revision ID: 0004_child_pce_credit_ledger
Revises: 0003_delivery_archived_at
Create Date: 2025-12-17

Golden Record changes:
- Storage quota and PCE status move to Child ("O Livro").
- Deliveries track credit lifecycle (reserved/consumed/refunded).
- partners_ledger provides auditable credit movements for partners.

Notes:
- We keep existing columns on Account for backward compatibility.
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0004_child_pce_credit_ledger"
down_revision = "0003_delivery_archived_at"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Children: quota + PCE status (child-centric) ---
    op.add_column(
        "children",
        sa.Column(
            "storage_quota_bytes",
            sa.BigInteger(),
            nullable=False,
            server_default=sa.text(str(2 * 1024 * 1024 * 1024)),
            comment="Storage quota (bytes) for this Child (default 2 GiB)",
        ),
    )

    child_pce_status_enum = postgresql.ENUM(
        "paid",
        "unpaid",
        name="child_pce_status_enum",
        create_type=False,
    )
    child_pce_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "children",
        sa.Column(
            "pce_status",
            child_pce_status_enum,
            nullable=False,
            server_default=sa.text("'unpaid'"),
            comment="Financial status for the Child PCE (paid/unpaid)",
        ),
    )

    # --- Deliveries: credit lifecycle ---
    delivery_credit_status_enum = postgresql.ENUM(
        "reserved",
        "consumed",
        "refunded",
        name="delivery_credit_status_enum",
        create_type=False,
    )
    delivery_credit_status_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "deliveries",
        sa.Column(
            "credit_status",
            delivery_credit_status_enum,
            nullable=False,
            server_default=sa.text("'reserved'"),
            comment="Partner credit lifecycle for this delivery (reserved/consumed/refunded)",
        ),
    )

    op.create_index(
        "ix_deliveries_partner_credit_status",
        "deliveries",
        ["partner_id", "credit_status"],
    )

    # --- Partner Ledger (audit trail) ---
    partner_ledger_type_enum = postgresql.ENUM(
        "reservation",
        "refund",
        "purchase",
        name="partner_ledger_type_enum",
        create_type=False,
    )
    partner_ledger_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "partners_ledger",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column(
            "partner_id",
            sa.Uuid(),
            sa.ForeignKey("partners.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "amount",
            sa.Integer(),
            nullable=False,
            comment="E.g. -1 (reservation), +1 (refund), +10 (purchase)",
        ),
        sa.Column("type", partner_ledger_type_enum, nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
    )

    op.create_index(
        "ix_partners_ledger_partner_created",
        "partners_ledger",
        ["partner_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_partners_ledger_partner_created", table_name="partners_ledger")
    op.drop_table("partners_ledger")

    partner_ledger_type_enum = sa.Enum(
        "reservation",
        "refund",
        "purchase",
        name="partner_ledger_type_enum",
    )
    partner_ledger_type_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_index("ix_deliveries_partner_credit_status", table_name="deliveries")
    op.drop_column("deliveries", "credit_status")

    delivery_credit_status_enum = sa.Enum(
        "reserved",
        "consumed",
        "refunded",
        name="delivery_credit_status_enum",
    )
    delivery_credit_status_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_column("children", "pce_status")
    child_pce_status_enum = sa.Enum("paid", "unpaid", name="child_pce_status_enum")
    child_pce_status_enum.drop(op.get_bind(), checkfirst=True)

    op.drop_column("children", "storage_quota_bytes")
