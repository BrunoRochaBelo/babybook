"""Adiciona modelos B2B2C: Partner, Voucher, Delivery, DeliveryAsset

Revision ID: 0002_b2b2c_partners_vouchers
Revises: 0001_initial_schema
Create Date: 2025-12-08 12:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "0002_b2b2c_partners_vouchers"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Criar enums
    partner_status_enum = sa.Enum(
        "active", "inactive", "suspended",
        name="partner_status_enum"
    )
    voucher_status_enum = sa.Enum(
        "available", "redeemed", "expired", "revoked",
        name="voucher_status_enum"
    )
    delivery_status_enum = sa.Enum(
        "pending", "processing", "completed", "failed",
        name="delivery_status_enum"
    )

    partner_status_enum.create(op.get_bind(), checkfirst=True)
    voucher_status_enum.create(op.get_bind(), checkfirst=True)
    delivery_status_enum.create(op.get_bind(), checkfirst=True)

    # Criar tabela partners
    op.create_table(
        "partners",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("email", sa.String(180), nullable=False),
        sa.Column("phone", sa.String(32), nullable=True),
        sa.Column("company_name", sa.String(200), nullable=True),
        sa.Column("cnpj", sa.String(18), nullable=True),
        sa.Column(
            "status",
            partner_status_enum,
            nullable=False,
            server_default="active",
        ),
        sa.Column("contact_name", sa.String(160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
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
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_partners_slug", "partners", ["slug"], unique=True)
    op.create_index("ix_partners_email", "partners", ["email"], unique=True)

    # Criar tabela deliveries primeiro (Voucher referencia Delivery)
    op.create_table(
        "deliveries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("partner_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "status",
            delivery_status_enum,
            nullable=False,
            server_default="pending",
        ),
        sa.Column("beneficiary_email", sa.String(180), nullable=True),
        sa.Column("beneficiary_name", sa.String(160), nullable=True),
        sa.Column("beneficiary_phone", sa.String(32), nullable=True),
        sa.Column("target_account_id", sa.Uuid(), nullable=True),
        sa.Column("assets_transferred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
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
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["partner_id"],
            ["partners.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["target_account_id"],
            ["accounts.id"],
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_deliveries_partner_id", "deliveries", ["partner_id"])
    op.create_index(
        "ix_deliveries_partner_status",
        "deliveries",
        ["partner_id", "status"],
    )

    # Criar tabela vouchers
    op.create_table(
        "vouchers",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("partner_id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(32), nullable=False),
        sa.Column(
            "status",
            voucher_status_enum,
            nullable=False,
            server_default="available",
        ),
        sa.Column("discount_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("uses_limit", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("beneficiary_id", sa.Uuid(), nullable=True),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_id", sa.Uuid(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
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
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["partner_id"],
            ["partners.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["beneficiary_id"],
            ["accounts.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["delivery_id"],
            ["deliveries.id"],
            ondelete="SET NULL",
        ),
    )
    op.create_index("ix_vouchers_code", "vouchers", ["code"], unique=True)
    op.create_index("ix_vouchers_partner_id", "vouchers", ["partner_id"])
    op.create_index(
        "ix_vouchers_status_expires",
        "vouchers",
        ["status", "expires_at"],
    )

    # Criar tabela delivery_assets
    op.create_table(
        "delivery_assets",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("delivery_id", sa.Uuid(), nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("transferred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("target_asset_id", sa.Uuid(), nullable=True),
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
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["delivery_id"],
            ["deliveries.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["asset_id"],
            ["assets.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["target_asset_id"],
            ["assets.id"],
            ondelete="SET NULL",
        ),
        sa.UniqueConstraint("delivery_id", "asset_id", name="uq_delivery_asset"),
    )
    op.create_index("ix_delivery_assets_delivery_id", "delivery_assets", ["delivery_id"])
    op.create_index("ix_delivery_assets_asset_id", "delivery_assets", ["asset_id"])


def downgrade() -> None:
    # Remover tabelas na ordem inversa
    op.drop_table("delivery_assets")
    op.drop_table("vouchers")
    op.drop_table("deliveries")
    op.drop_table("partners")

    # Remover enums
    op.execute("DROP TYPE IF EXISTS delivery_status_enum")
    op.execute("DROP TYPE IF EXISTS voucher_status_enum")
    op.execute("DROP TYPE IF EXISTS partner_status_enum")
