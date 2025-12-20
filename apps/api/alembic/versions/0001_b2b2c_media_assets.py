"""Create B2B2C and media assets tables

Revision ID: 0001_b2b2c_media_assets
Revises: 0000_core_schema
Create Date: 2025-12-09
"""
from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "0001_b2b2c_media_assets"
down_revision = "0000_core_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()

    partner_status_enum = postgresql.ENUM(
        "pending_approval",
        "active",
        "inactive",
        "suspended",
        name="partner_status_enum",
        create_type=False,
    )
    voucher_status_enum = postgresql.ENUM(
        "available",
        "redeemed",
        "expired",
        "revoked",
        name="voucher_status_enum",
        create_type=False,
    )
    delivery_status_enum = postgresql.ENUM(
        "draft",
        "pending_upload",
        "ready",
        "pending",
        "processing",
        "completed",
        "failed",
        name="delivery_status_enum",
        create_type=False,
    )
    media_processing_status_enum = postgresql.ENUM(
        "ready",
        "processing",
        "failed",
        name="media_processing_status_enum",
        create_type=False,
    )

    # Cria enums apenas se não existirem (permite rodar em bases já provisionadas)
    partner_status_enum.create(bind, checkfirst=True)
    voucher_status_enum.create(bind, checkfirst=True)
    delivery_status_enum.create(bind, checkfirst=True)
    media_processing_status_enum.create(bind, checkfirst=True)

    op.create_table(
        "partners",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("phone", sa.String(length=32), nullable=True),
        sa.Column("company_name", sa.String(length=200), nullable=True),
        sa.Column("cnpj", sa.String(length=18), nullable=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column(
            "status",
            partner_status_enum,
            nullable=False,
            server_default="pending_approval",
        ),
        sa.Column("contact_name", sa.String(length=160), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("voucher_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("slug", name="uq_partners_slug"),
        sa.UniqueConstraint("email", name="uq_partners_email"),
    )
    op.create_index("ix_partners_user_id", "partners", ["user_id"], unique=False)

    op.create_table(
        "deliveries",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("partner_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("client_name", sa.String(length=200), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", delivery_status_enum, nullable=False, server_default="draft"),
        sa.Column("assets_payload", sa.JSON(), nullable=True),
        sa.Column("generated_voucher_code", sa.String(length=32), nullable=True),
        sa.Column("beneficiary_email", sa.String(length=180), nullable=True),
        sa.Column("beneficiary_name", sa.String(length=160), nullable=True),
        sa.Column("beneficiary_phone", sa.String(length=32), nullable=True),
        sa.Column("target_account_id", sa.Uuid(), nullable=True),
        sa.Column("assets_transferred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["partner_id"], ["partners.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_account_id"], ["accounts.id"], ondelete="SET NULL"),
    )
    op.create_index("idx_deliveries_partner", "deliveries", ["partner_id"], unique=False)
    op.create_index("ix_deliveries_partner_status", "deliveries", ["partner_id", "status"], unique=False)
    op.create_index("ix_deliveries_generated_voucher_code", "deliveries", ["generated_voucher_code"], unique=False)

    op.create_table(
        "vouchers",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("partner_id", sa.Uuid(), nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("status", voucher_status_enum, nullable=False, server_default="available"),
        sa.Column("discount_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("uses_limit", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("uses_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("beneficiary_id", sa.Uuid(), nullable=True),
        sa.Column("redeemed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("delivery_id", sa.Uuid(), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["partner_id"], ["partners.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["beneficiary_id"], ["accounts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["delivery_id"], ["deliveries.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("code", name="uq_vouchers_code"),
    )
    op.create_index("ix_vouchers_partner_id", "vouchers", ["partner_id"], unique=False)
    op.create_index("ix_vouchers_status_expires", "vouchers", ["status", "expires_at"], unique=False)
    op.create_index("idx_vouchers_lookup", "vouchers", ["code"], unique=False, postgresql_where=sa.text("status = 'available'"))

    op.create_table(
        "delivery_assets",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("delivery_id", sa.Uuid(), nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("transferred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("target_asset_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["delivery_id"], ["deliveries.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["target_asset_id"], ["assets.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("delivery_id", "asset_id", name="uq_delivery_asset"),
    )
    op.create_index("ix_delivery_assets_delivery_id", "delivery_assets", ["delivery_id"], unique=False)
    op.create_index("ix_delivery_assets_asset_id", "delivery_assets", ["asset_id"], unique=False)

    op.create_table(
        "media_assets",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("storage_path_original", sa.String(length=500), nullable=True),
        sa.Column("storage_path_optimized", sa.String(length=500), nullable=True),
        sa.Column("storage_path_thumb", sa.String(length=500), nullable=True),
        sa.Column("processing_status", media_processing_status_enum, nullable=False, server_default="ready"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_media_assets_user_id", "media_assets", ["user_id"], unique=False)
    op.create_index(
        "idx_assets_processing",
        "media_assets",
        ["processing_status"],
        unique=False,
        postgresql_where=sa.text("processing_status = 'processing'"),
    )


def downgrade() -> None:
    op.drop_index("idx_assets_processing", table_name="media_assets")
    op.drop_index("ix_media_assets_user_id", table_name="media_assets")
    op.drop_table("media_assets")

    op.drop_index("ix_delivery_assets_asset_id", table_name="delivery_assets")
    op.drop_index("ix_delivery_assets_delivery_id", table_name="delivery_assets")
    op.drop_table("delivery_assets")

    op.drop_index("idx_vouchers_lookup", table_name="vouchers")
    op.drop_index("ix_vouchers_status_expires", table_name="vouchers")
    op.drop_index("ix_vouchers_partner_id", table_name="vouchers")
    op.drop_table("vouchers")

    op.drop_index("ix_deliveries_generated_voucher_code", table_name="deliveries")
    op.drop_index("ix_deliveries_partner_status", table_name="deliveries")
    op.drop_index("idx_deliveries_partner", table_name="deliveries")
    op.drop_table("deliveries")

    op.drop_index("ix_partners_user_id", table_name="partners")
    op.drop_table("partners")

    op.execute("DROP TYPE IF EXISTS media_processing_status_enum")
    op.execute("DROP TYPE IF EXISTS delivery_status_enum")
    op.execute("DROP TYPE IF EXISTS voucher_status_enum")
    op.execute("DROP TYPE IF EXISTS partner_status_enum")
