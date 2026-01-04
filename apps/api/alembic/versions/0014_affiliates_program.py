"""Affiliate program (affiliates, sales, payouts, config)

Revision ID: 0014_affiliates_program
Revises: 0013_guestbook_invites_relationship_degree, 34b05ce16909
Create Date: 2026-01-04

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "0014_affiliates_program"
down_revision: Union[str, tuple[str, ...], None] = (
    "0013_guestbook_invites_relationship_degree",
    "34b05ce16909",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _enum(bind, name: str, values: list[str]):
    if bind.dialect.name == "postgresql":
        enum = postgresql.ENUM(*values, name=name, create_type=False)
        enum.create(bind, checkfirst=True)
        return enum
    return sa.Enum(*values, name=name)


def upgrade() -> None:
    bind = op.get_bind()

    affiliate_status_enum = _enum(bind, "affiliate_status_enum", ["active", "paused"])
    sale_status_enum = _enum(bind, "affiliate_sale_status_enum", ["pending", "approved", "refunded"])
    payout_status_enum = _enum(bind, "affiliate_payout_status_enum", ["requested", "paid", "rejected"])

    op.create_table(
        "affiliate_program_config",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("default_commission_rate", sa.Float(), nullable=False, server_default=sa.text("0.15")),
        sa.Column("minimum_payout_cents", sa.Integer(), nullable=False, server_default=sa.text("5000")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # Singleton default row (id=1)
    if bind.dialect.name == "postgresql":
        op.execute(
            "INSERT INTO affiliate_program_config (id, default_commission_rate, minimum_payout_cents) VALUES (1, 0.15, 5000) "
            "ON CONFLICT (id) DO NOTHING"
        )
    elif bind.dialect.name == "sqlite":
        op.execute(
            "INSERT OR IGNORE INTO affiliate_program_config (id, default_commission_rate, minimum_payout_cents) VALUES (1, 0.15, 5000)"
        )
    else:
        # fallback best-effort
        op.execute(
            "INSERT INTO affiliate_program_config (id, default_commission_rate, minimum_payout_cents) VALUES (1, 0.15, 5000)"
        )

    op.create_table(
        "affiliates",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("code", sa.String(length=80), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("status", affiliate_status_enum, nullable=False, server_default=sa.text("'active'")),
        sa.Column("commission_rate", sa.Float(), nullable=False, server_default=sa.text("0.15")),
        sa.Column("payout_method", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )

    op.create_index("ix_affiliates_code", "affiliates", ["code"], unique=True)
    op.create_index("ix_affiliates_email", "affiliates", ["email"], unique=True)
    op.create_index("ix_affiliates_status", "affiliates", ["status"], unique=False)
    op.create_index("ix_affiliates_user_id", "affiliates", ["user_id"], unique=True)

    op.create_table(
        "affiliate_sales",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("affiliate_id", sa.Uuid(), nullable=False),
        sa.Column("order_id", sa.String(length=120), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("commission_cents", sa.Integer(), nullable=False),
        sa.Column("status", sale_status_enum, nullable=False, server_default=sa.text("'approved'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["affiliate_id"], ["affiliates.id"], ondelete="CASCADE"),
    )

    op.create_index(
        "ix_affiliate_sales_affiliate_occurred",
        "affiliate_sales",
        ["affiliate_id", "occurred_at"],
        unique=False,
    )
    op.create_index("ix_affiliate_sales_order_id", "affiliate_sales", ["order_id"], unique=False)

    op.create_table(
        "affiliate_payouts",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("affiliate_id", sa.Uuid(), nullable=False),
        sa.Column("amount_cents", sa.Integer(), nullable=False),
        sa.Column("status", payout_status_enum, nullable=False, server_default=sa.text("'requested'")),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["affiliate_id"], ["affiliates.id"], ondelete="CASCADE"),
    )

    op.create_index(
        "ix_affiliate_payouts_affiliate_requested",
        "affiliate_payouts",
        ["affiliate_id", "requested_at"],
        unique=False,
    )


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_index("ix_affiliate_payouts_affiliate_requested", table_name="affiliate_payouts")
    op.drop_table("affiliate_payouts")

    op.drop_index("ix_affiliate_sales_order_id", table_name="affiliate_sales")
    op.drop_index("ix_affiliate_sales_affiliate_occurred", table_name="affiliate_sales")
    op.drop_table("affiliate_sales")

    op.drop_index("ix_affiliates_user_id", table_name="affiliates")
    op.drop_index("ix_affiliates_status", table_name="affiliates")
    op.drop_index("ix_affiliates_email", table_name="affiliates")
    op.drop_index("ix_affiliates_code", table_name="affiliates")
    op.drop_table("affiliates")

    op.drop_table("affiliate_program_config")

    if bind.dialect.name == "postgresql":
        postgresql.ENUM("requested", "paid", "rejected", name="affiliate_payout_status_enum", create_type=False).drop(
            bind, checkfirst=True
        )
        postgresql.ENUM("pending", "approved", "refunded", name="affiliate_sale_status_enum", create_type=False).drop(
            bind, checkfirst=True
        )
        postgresql.ENUM("active", "paused", name="affiliate_status_enum", create_type=False).drop(bind, checkfirst=True)
