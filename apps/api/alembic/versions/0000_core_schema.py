"""Core schema baseline (pre-B2B2C)

Revision ID: 0000_core_schema
Revises:
Create Date: 2025-12-17

This migration bootstraps the *core* Babybook schema required by subsequent
B2B2C/Partner Portal migrations.

Important:
- It intentionally does NOT create B2B2C tables/enums (partners, deliveries,
  vouchers, delivery_assets, media_assets, partners_ledger).
- It also represents the schema state *before* later incremental migrations
  (e.g. billing breakdown fields, child-centric PCE/quota, assets child_id).

Goal: allow running `alembic upgrade head` on an empty Postgres database.
"""

from __future__ import annotations

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision = "0000_core_schema"
down_revision = None
branch_labels = None
depends_on = None


def _core_enums(bind):
    """Return Enum instances compatible with the current dialect."""
    if bind.dialect.name == "postgresql":
        moment_status_enum = postgresql.ENUM(
            "draft",
            "published",
            "archived",
            name="moment_status_enum",
            create_type=False,
        )
        moment_privacy_enum = postgresql.ENUM(
            "private",
            "people",
            "public",
            name="moment_privacy_enum",
            create_type=False,
        )
        guestbook_status_enum = postgresql.ENUM(
            "pending",
            "approved",
            "hidden",
            name="guestbook_status_enum",
            create_type=False,
        )
        asset_kind_enum = postgresql.ENUM(
            "photo",
            "video",
            "audio",
            name="asset_kind_enum",
            create_type=False,
        )
        asset_status_enum = postgresql.ENUM(
            "queued",
            "processing",
            "ready",
            "failed",
            name="asset_status_enum",
            create_type=False,
        )
        vault_kind_enum = postgresql.ENUM(
            "certidao",
            "cpf_rg",
            "sus_plano",
            "outro",
            name="vault_kind_enum",
            create_type=False,
        )

        for enum in (
            moment_status_enum,
            moment_privacy_enum,
            guestbook_status_enum,
            asset_kind_enum,
            asset_status_enum,
            vault_kind_enum,
        ):
            enum.create(bind, checkfirst=True)

        return (
            moment_status_enum,
            moment_privacy_enum,
            guestbook_status_enum,
            asset_kind_enum,
            asset_status_enum,
            vault_kind_enum,
        )

    # Non-Postgres: use generic Enum (e.g. SQLite CHECK constraint)
    moment_status_enum = sa.Enum("draft", "published", "archived", name="moment_status_enum")
    moment_privacy_enum = sa.Enum("private", "people", "public", name="moment_privacy_enum")
    guestbook_status_enum = sa.Enum("pending", "approved", "hidden", name="guestbook_status_enum")
    asset_kind_enum = sa.Enum("photo", "video", "audio", name="asset_kind_enum")
    asset_status_enum = sa.Enum("queued", "processing", "ready", "failed", name="asset_status_enum")
    vault_kind_enum = sa.Enum("certidao", "cpf_rg", "sus_plano", "outro", name="vault_kind_enum")

    return (
        moment_status_enum,
        moment_privacy_enum,
        guestbook_status_enum,
        asset_kind_enum,
        asset_status_enum,
        vault_kind_enum,
    )


def upgrade() -> None:
    bind = op.get_bind()

    (
        moment_status_enum,
        moment_privacy_enum,
        guestbook_status_enum,
        asset_kind_enum,
        asset_status_enum,
        vault_kind_enum,
    ) = _core_enums(bind)

    # --- Accounts ---
    op.create_table(
        "accounts",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=80), nullable=False),
        sa.Column("plan", sa.String(length=64), nullable=False, server_default="plano_base"),
        sa.Column("storage_bytes_used", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column(
            "plan_storage_bytes",
            sa.BigInteger(),
            nullable=False,
            server_default=str(2 * 1024 * 1024 * 1024),
        ),
        sa.Column("plan_moments_limit", sa.Integer(), nullable=False, server_default="60"),
        sa.Column("unlimited_social", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("unlimited_creative", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("unlimited_tracking", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_accounts_slug"),
    )
    op.create_index("ix_accounts_slug", "accounts", ["slug"], unique=True)

    # --- Users ---
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(length=180), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("locale", sa.String(length=10), nullable=False, server_default="pt-BR"),
        sa.Column("role", sa.String(length=32), nullable=False, server_default="owner"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_account_id", "users", ["account_id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # --- Sessions ---
    op.create_table(
        "sessions",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("token", sa.String(length=128), nullable=False),
        sa.Column("csrf_token", sa.String(length=128), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_ip", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("token", name="uq_sessions_token"),
    )
    op.create_index("ix_sessions_token", "sessions", ["token"], unique=True)

    # --- Children (pre child-centric quota/PCE fields) ---
    op.create_table(
        "children",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("birthday", sa.Date(), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )

    # --- People ---
    op.create_table(
        "people",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )

    # --- Series ---
    op.create_table(
        "series",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("rrule", sa.Text(), nullable=False),
        sa.Column("tz", sa.String(length=64), nullable=False, server_default="UTC"),
        sa.Column("rev", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )

    # --- Moments ---
    op.create_table(
        "moments",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("series_id", sa.Uuid(), nullable=True),
        sa.Column("template_key", sa.String(length=80), nullable=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", moment_status_enum, nullable=False, server_default="draft"),
        sa.Column("privacy", moment_privacy_enum, nullable=False, server_default="private"),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rev", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["series_id"], ["series.id"], ondelete="SET NULL"),
    )

    # --- Series occurrences ---
    op.create_table(
        "series_occurrences",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("series_id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("moment_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["series_id"], ["series.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["moment_id"], ["moments.id"], ondelete="SET NULL"),
    )

    # --- Assets (pre child_id + pre child-scoped sha uniqueness) ---
    op.create_table(
        "assets",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("kind", asset_kind_enum, nullable=False),
        sa.Column("status", asset_status_enum, nullable=False, server_default="queued"),
        sa.Column("scope", sa.String(length=32), nullable=False, server_default="moment"),
        sa.Column("mime", sa.String(length=180), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("sha256", sa.String(length=128), nullable=False),
        sa.Column("key_original", sa.String(length=255), nullable=True),
        sa.Column("billable", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("viewer_accessible", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("error_code", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("account_id", "sha256", name="uq_asset_account_sha256"),
    )

    # --- Asset variants ---
    op.create_table(
        "asset_variants",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.Column("vtype", asset_kind_enum, nullable=False),
        sa.Column("preset", sa.String(length=80), nullable=False),
        sa.Column("key", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("width_px", sa.Integer(), nullable=True),
        sa.Column("height_px", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
    )

    # --- Upload sessions ---
    op.create_table(
        "upload_sessions",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.Column("filename", sa.String(length=255), nullable=False),
        sa.Column("mime", sa.String(length=180), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("sha256", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="pending"),
        sa.Column("part_size", sa.Integer(), nullable=False),
        sa.Column("part_count", sa.Integer(), nullable=False),
        sa.Column("etags", sa.JSON(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="CASCADE"),
    )

    # --- Worker jobs ---
    op.create_table(
        "worker_jobs",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=True),
        sa.Column("kind", sa.String(length=120), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("metadata", sa.JSON(), nullable=False),
        sa.Column("status", sa.String(length=24), nullable=False, server_default="pending"),
        sa.Column("available_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="SET NULL"),
    )
    op.create_index("ix_worker_jobs_status_available", "worker_jobs", ["status", "available_at"], unique=False)

    # --- Share links ---
    op.create_table(
        "share_links",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("moment_id", sa.Uuid(), nullable=False, unique=True),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["moment_id"], ["moments.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("token", name="uq_share_links_token"),
    )
    op.create_index("ix_share_links_token", "share_links", ["token"], unique=True)

    # --- Guestbook entries ---
    op.create_table(
        "guestbook_entries",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("share_link_id", sa.Uuid(), nullable=True),
        sa.Column("author_name", sa.String(length=120), nullable=False),
        sa.Column("author_email", sa.String(length=180), nullable=True),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", guestbook_status_enum, nullable=False, server_default="pending"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["share_link_id"], ["share_links.id"], ondelete="SET NULL"),
    )

    # --- Chapters ---
    op.create_table(
        "chapters",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("slug", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_asset_id", sa.Uuid(), nullable=True),
        sa.Column("is_manual_order", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("rev", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cover_asset_id"], ["assets.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("account_id", "slug", name="uq_chapter_account_slug"),
    )

    # --- Chapter moments ---
    op.create_table(
        "chapter_moments",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("chapter_id", sa.Uuid(), nullable=False),
        sa.Column("moment_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["chapter_id"], ["chapters.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["moment_id"], ["moments.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("chapter_id", "moment_id", name="uq_chapter_moment"),
    )

    # --- Vault documents ---
    op.create_table(
        "vault_documents",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("kind", vault_kind_enum, nullable=False),
        sa.Column("asset_id", sa.Uuid(), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["asset_id"], ["assets.id"], ondelete="RESTRICT"),
    )

    # --- Billing events (pre breakdown fields) ---
    op.create_table(
        "billing_events",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("event_id", sa.String(length=128), nullable=False),
        sa.Column("package_key", sa.String(length=64), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=True),
        sa.Column("currency", sa.String(length=16), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("event_id", name="uq_billing_events_event_id"),
    )
    op.create_index("ix_billing_events_event_id", "billing_events", ["event_id"], unique=True)

    # --- Moment templates ---
    op.create_table(
        "moment_templates",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=True),
        sa.Column("key", sa.String(length=120), nullable=False),
        sa.Column("display_name", sa.String(length=160), nullable=False),
        sa.Column("upsell_category", sa.String(length=32), nullable=True),
        sa.Column("limits", sa.JSON(), nullable=False),
        sa.Column("rules", sa.JSON(), nullable=True),
        sa.Column("prompt_microcopy", sa.JSON(), nullable=True),
        sa.Column("data_schema", sa.JSON(), nullable=True),
        sa.Column("ui_schema", sa.JSON(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=True),
        sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("account_id", "key", "version", name="uq_template_key_version"),
    )

    # --- App policies ---
    op.create_table(
        "app_policies",
        sa.Column("account_id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("photos_per_moment", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("audios_per_moment", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("video_max_sec", sa.Integer(), nullable=False, server_default="10"),
        sa.Column("recurrent_moment_limit", sa.Integer(), nullable=False, server_default="5"),
        sa.Column("guestbook_default_limit", sa.Integer(), nullable=False, server_default="50"),
        sa.Column("guestbook_allow_media", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("rev", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
    )


def downgrade() -> None:
    # Drop tables in reverse dependency order.
    op.drop_table("app_policies")
    op.drop_table("moment_templates")
    op.drop_index("ix_billing_events_event_id", table_name="billing_events")
    op.drop_table("billing_events")
    op.drop_table("vault_documents")
    op.drop_table("chapter_moments")
    op.drop_table("chapters")
    op.drop_table("guestbook_entries")
    op.drop_index("ix_share_links_token", table_name="share_links")
    op.drop_table("share_links")
    op.drop_index("ix_worker_jobs_status_available", table_name="worker_jobs")
    op.drop_table("worker_jobs")
    op.drop_table("upload_sessions")
    op.drop_table("asset_variants")
    op.drop_table("assets")
    op.drop_table("series_occurrences")
    op.drop_table("moments")
    op.drop_table("series")
    op.drop_table("people")
    op.drop_table("children")
    op.drop_index("ix_sessions_token", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_account_id", table_name="users")
    op.drop_table("users")
    op.drop_index("ix_accounts_slug", table_name="accounts")
    op.drop_table("accounts")

    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        # Drop ENUM types if present.
        op.execute("DROP TYPE IF EXISTS vault_kind_enum")
        op.execute("DROP TYPE IF EXISTS asset_status_enum")
        op.execute("DROP TYPE IF EXISTS asset_kind_enum")
        op.execute("DROP TYPE IF EXISTS guestbook_status_enum")
        op.execute("DROP TYPE IF EXISTS moment_privacy_enum")
        op.execute("DROP TYPE IF EXISTS moment_status_enum")
