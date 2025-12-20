from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    func,
)
from sqlalchemy.ext.mutable import MutableDict, MutableList
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


moment_status_enum = Enum("draft", "published", "archived", name="moment_status_enum")
moment_privacy_enum = Enum("private", "people", "public", name="moment_privacy_enum")
guestbook_status_enum = Enum("pending", "approved", "hidden", name="guestbook_status_enum")
asset_kind_enum = Enum("photo", "video", "audio", name="asset_kind_enum")
asset_status_enum = Enum("queued", "processing", "ready", "failed", name="asset_status_enum")
vault_kind_enum = Enum("certidao", "cpf_rg", "sus_plano", "outro", name="vault_kind_enum")

# B2B2C / Voucher enums
partner_status_enum = Enum(
    "pending_approval",
    "active",
    "inactive",
    "suspended",
    name="partner_status_enum",
)
voucher_status_enum = Enum("available", "redeemed", "expired", "revoked", name="voucher_status_enum")
delivery_status_enum = Enum(
    "draft",
    "pending_upload",
    "ready",
    "pending",
    "processing",
    "completed",
    "failed",
    name="delivery_status_enum",
)

# Golden Record: Credit lifecycle on deliveries (reservation/consumption/refund)
delivery_credit_status_enum = Enum(
    "reserved",
    "consumed",
    "refunded",
    "not_required",
    name="delivery_credit_status_enum",
)

# Golden Record: PCE status is child-centric
child_pce_status_enum = Enum(
    "paid",
    "unpaid",
    name="child_pce_status_enum",
)

partner_ledger_type_enum = Enum(
    "reservation",
    "refund",
    "purchase",
    name="partner_ledger_type_enum",
)
media_processing_status_enum = Enum(
    "ready",
    "processing",
    "failed",
    name="media_processing_status_enum",
)


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )


class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Account(TimestampMixin, Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    plan: Mapped[str] = mapped_column(String(64), default="plano_base")
    storage_bytes_used: Mapped[int] = mapped_column(BigInteger, default=0)
    plan_storage_bytes: Mapped[int] = mapped_column(BigInteger, default=2 * 1024 * 1024 * 1024)
    plan_moments_limit: Mapped[int] = mapped_column(Integer, default=60)
    unlimited_social: Mapped[bool] = mapped_column(Boolean, default=False)
    unlimited_creative: Mapped[bool] = mapped_column(Boolean, default=False)
    unlimited_tracking: Mapped[bool] = mapped_column(Boolean, default=False)

    users: Mapped[list["User"]] = relationship(back_populates="account", cascade="all,delete")
    children: Mapped[list["Child"]] = relationship(back_populates="account", cascade="all,delete")
    people: Mapped[list["Person"]] = relationship(back_populates="account", cascade="all,delete")
    moments: Mapped[list["Moment"]] = relationship(back_populates="account", cascade="all,delete")
    share_links: Mapped[list["ShareLink"]] = relationship(back_populates="account", cascade="all,delete")
    assets: Mapped[list["Asset"]] = relationship(back_populates="account", cascade="all,delete")
    upload_sessions: Mapped[list["UploadSession"]] = relationship(back_populates="account", cascade="all,delete")
    series: Mapped[list["Series"]] = relationship(back_populates="account", cascade="all,delete")
    chapters: Mapped[list["Chapter"]] = relationship(back_populates="account", cascade="all,delete")
    vault_documents: Mapped[list["VaultDocument"]] = relationship(back_populates="account", cascade="all,delete")
    billing_events: Mapped[list["BillingEvent"]] = relationship(back_populates="account", cascade="all,delete")
    policy: Mapped["AppPolicy | None"] = relationship(back_populates="account", cascade="all,delete-orphan", uselist=False)
    moment_templates: Mapped[list["MomentTemplate"]] = relationship(back_populates="account", cascade="all,delete")
    worker_jobs: Mapped[list["WorkerJob"]] = relationship(back_populates="account", cascade="all,delete")
    # B2B2C: vouchers resgatados por esta conta
    redeemed_vouchers: Mapped[list["Voucher"]] = relationship(
        foreign_keys="Voucher.beneficiary_id",
        viewonly=True,
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        index=True,
    )
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    locale: Mapped[str] = mapped_column(String(10), default="pt-BR")
    role: Mapped[str] = mapped_column(String(32), default="owner")

    account: Mapped[Account] = relationship(back_populates="users")
    sessions: Mapped[list["Session"]] = relationship(back_populates="user", cascade="all,delete")
    media_assets: Mapped[list["MediaAsset"]] = relationship(back_populates="user", cascade="all,delete")


class Session(TimestampMixin, Base):
    __tablename__ = "sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"))
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    csrf_token: Mapped[str] = mapped_column(String(128))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_ip: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)

    user: Mapped[User] = relationship(back_populates="sessions")
    account: Mapped[Account] = relationship()


class Child(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "children"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Golden Record: quota and PCE are child-centric
    storage_quota_bytes: Mapped[int] = mapped_column(
        BigInteger,
        default=2 * 1024 * 1024 * 1024,
    )
    pce_status: Mapped[str] = mapped_column(child_pce_status_enum, default="unpaid")

    account: Mapped[Account] = relationship(back_populates="children")
    moments: Mapped[list["Moment"]] = relationship(back_populates="child", cascade="all,delete")
    chapters: Mapped[list["Chapter"]] = relationship(back_populates="child", cascade="all,delete")
    vault_documents: Mapped[list["VaultDocument"]] = relationship(back_populates="child", cascade="all,delete")


class Person(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "people"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(120))
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    account: Mapped[Account] = relationship(back_populates="people")


class Series(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "series"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(160))
    rrule: Mapped[str] = mapped_column(Text)
    tz: Mapped[str] = mapped_column(String(64), default="UTC")
    rev: Mapped[int] = mapped_column(Integer, default=1)

    account: Mapped[Account] = relationship(back_populates="series")
    occurrences: Mapped[list["SeriesOccurrence"]] = relationship(back_populates="series", cascade="all,delete-orphan")
    moments: Mapped[list["Moment"]] = relationship(back_populates="series")


class Moment(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "moments"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    child_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("children.id", ondelete="CASCADE"))
    series_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("series.id", ondelete="SET NULL"), nullable=True)
    template_key: Mapped[str | None] = mapped_column(String(80), nullable=True)
    title: Mapped[str] = mapped_column(String(160))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(moment_status_enum, default="draft")
    privacy: Mapped[str] = mapped_column(moment_privacy_enum, default="private")
    payload: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON), nullable=True, default=dict)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rev: Mapped[int] = mapped_column(Integer, default=1)

    account: Mapped[Account] = relationship(back_populates="moments")
    child: Mapped[Child] = relationship(back_populates="moments")
    share_link: Mapped[ShareLink | None] = relationship(back_populates="moment", uselist=False)
    series: Mapped[Series | None] = relationship(back_populates="moments")
    chapter_items: Mapped[list["ChapterMoment"]] = relationship(back_populates="moment", cascade="all,delete-orphan")


class SeriesOccurrence(TimestampMixin, Base):
    __tablename__ = "series_occurrences"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    series_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("series.id", ondelete="CASCADE"))
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    moment_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("moments.id", ondelete="SET NULL"), nullable=True)

    series: Mapped[Series] = relationship(back_populates="occurrences")
    moment: Mapped[Moment | None] = relationship()


class Asset(TimestampMixin, Base):
    __tablename__ = "assets"
    __table_args__ = (UniqueConstraint("account_id", "child_id", "sha256", name="uq_asset_account_child_sha256"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    child_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("children.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    kind: Mapped[str] = mapped_column(asset_kind_enum)
    status: Mapped[str] = mapped_column(asset_status_enum, default="queued")
    scope: Mapped[str] = mapped_column(String(32), default="moment")
    mime: Mapped[str] = mapped_column(String(180))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    sha256: Mapped[str] = mapped_column(String(128))
    key_original: Mapped[str | None] = mapped_column(String(255), nullable=True)
    billable: Mapped[bool] = mapped_column(Boolean, default=True)
    viewer_accessible: Mapped[bool] = mapped_column(Boolean, default=False)
    error_code: Mapped[str | None] = mapped_column(String(120), nullable=True)

    account: Mapped[Account] = relationship(back_populates="assets")
    child: Mapped[Child | None] = relationship()
    variants: Mapped[list["AssetVariant"]] = relationship(back_populates="asset", cascade="all,delete-orphan")
    upload_sessions: Mapped[list["UploadSession"]] = relationship(back_populates="asset", cascade="all,delete-orphan")
    vault_documents: Mapped[list["VaultDocument"]] = relationship(back_populates="asset")


class AssetVariant(TimestampMixin, Base):
    __tablename__ = "asset_variants"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    asset_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("assets.id", ondelete="CASCADE"))
    vtype: Mapped[str] = mapped_column(asset_kind_enum)
    preset: Mapped[str] = mapped_column(String(80))
    key: Mapped[str] = mapped_column(String(255))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    width_px: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height_px: Mapped[int | None] = mapped_column(Integer, nullable=True)

    asset: Mapped[Asset] = relationship(back_populates="variants")


class MediaAsset(TimestampMixin, Base):
    __tablename__ = "media_assets"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    user_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    storage_path_original: Mapped[str | None] = mapped_column(String(500), nullable=True)
    storage_path_optimized: Mapped[str | None] = mapped_column(String(500), nullable=True)
    storage_path_thumb: Mapped[str | None] = mapped_column(String(500), nullable=True)
    processing_status: Mapped[str] = mapped_column(media_processing_status_enum, default="ready")

    user: Mapped[User | None] = relationship(back_populates="media_assets")


class UploadSession(TimestampMixin, Base):
    __tablename__ = "upload_sessions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    asset_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("assets.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String(255))
    mime: Mapped[str] = mapped_column(String(180))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    sha256: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(24), default="pending")
    part_size: Mapped[int] = mapped_column(Integer)
    part_count: Mapped[int] = mapped_column(Integer)
    etags: Mapped[list[dict[str, Any]] | None] = mapped_column(MutableList.as_mutable(JSON), nullable=True, default=list)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    asset: Mapped[Asset] = relationship(back_populates="upload_sessions")
    account: Mapped[Account] = relationship(back_populates="upload_sessions")


class WorkerJob(TimestampMixin, Base):
    __tablename__ = "worker_jobs"
    __table_args__ = (
        Index("ix_worker_jobs_status_available", "status", "available_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True,
    )
    kind: Mapped[str] = mapped_column(String(120))
    payload: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON), default=dict)
    job_metadata: Mapped[dict[str, Any]] = mapped_column("metadata", MutableDict.as_mutable(JSON), default=dict)
    status: Mapped[str] = mapped_column(String(24), default="pending")
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    account: Mapped[Account | None] = relationship(back_populates="worker_jobs")


class ShareLink(TimestampMixin, Base):
    __tablename__ = "share_links"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    moment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("moments.id", ondelete="CASCADE"), unique=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    account: Mapped[Account] = relationship(back_populates="share_links")
    moment: Mapped[Moment] = relationship(back_populates="share_link")
    guestbook_entries: Mapped[list["GuestbookEntry"]] = relationship(back_populates="share_link")


class GuestbookEntry(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "guestbook_entries"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    child_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("children.id", ondelete="CASCADE"))
    share_link_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("share_links.id", ondelete="SET NULL"),
        nullable=True,
    )
    author_name: Mapped[str] = mapped_column(String(120))
    author_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(guestbook_status_enum, default="pending")

    share_link: Mapped[ShareLink | None] = relationship(back_populates="guestbook_entries")


class Chapter(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "chapters"
    __table_args__ = (UniqueConstraint("account_id", "slug", name="uq_chapter_account_slug"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    child_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("children.id", ondelete="CASCADE"))
    title: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(160))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    cover_asset_id: Mapped[uuid.UUID | None] = mapped_column(Uuid, ForeignKey("assets.id", ondelete="SET NULL"), nullable=True)
    is_manual_order: Mapped[bool] = mapped_column(Boolean, default=False)
    rev: Mapped[int] = mapped_column(Integer, default=1)

    account: Mapped[Account] = relationship(back_populates="chapters")
    child: Mapped[Child] = relationship(back_populates="chapters")
    cover_asset: Mapped[Asset | None] = relationship()
    moments: Mapped[list["ChapterMoment"]] = relationship(back_populates="chapter", cascade="all,delete-orphan")


class ChapterMoment(TimestampMixin, Base):
    __tablename__ = "chapter_moments"
    __table_args__ = (UniqueConstraint("chapter_id", "moment_id", name="uq_chapter_moment"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    chapter_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("chapters.id", ondelete="CASCADE"))
    moment_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("moments.id", ondelete="CASCADE"))
    position: Mapped[int] = mapped_column(Integer)

    chapter: Mapped[Chapter] = relationship(back_populates="moments")
    moment: Mapped[Moment] = relationship(back_populates="chapter_items")


class VaultDocument(TimestampMixin, Base):
    __tablename__ = "vault_documents"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    child_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("children.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(vault_kind_enum)
    asset_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("assets.id", ondelete="RESTRICT"))
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    account: Mapped[Account] = relationship(back_populates="vault_documents")
    child: Mapped[Child] = relationship(back_populates="vault_documents")
    asset: Mapped[Asset] = relationship(back_populates="vault_documents")


class BillingEvent(TimestampMixin, Base):
    __tablename__ = "billing_events"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
    event_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    package_key: Mapped[str] = mapped_column(String(64))
    amount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    amount_gross: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gateway_fee: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pce_reserved: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tax_effective: Mapped[int | None] = mapped_column(Integer, nullable=True)
    currency: Mapped[str | None] = mapped_column(String(16), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON))

    account: Mapped[Account] = relationship(back_populates="billing_events")


class MomentTemplate(TimestampMixin, Base):
    __tablename__ = "moment_templates"
    __table_args__ = (UniqueConstraint("account_id", "key", "version", name="uq_template_key_version"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        nullable=True,
    )
    key: Mapped[str] = mapped_column(String(120))
    display_name: Mapped[str] = mapped_column(String(160))
    upsell_category: Mapped[str | None] = mapped_column(String(32), nullable=True)
    limits: Mapped[dict[str, Any]] = mapped_column(MutableDict.as_mutable(JSON))
    rules: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON), nullable=True)
    prompt_microcopy: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON), nullable=True)
    data_schema: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON), nullable=True)
    ui_schema: Mapped[dict[str, Any] | None] = mapped_column(MutableDict.as_mutable(JSON), nullable=True)
    order_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)

    account: Mapped[Account | None] = relationship(back_populates="moment_templates")


class AppPolicy(TimestampMixin, Base):
    __tablename__ = "app_policies"

    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    photos_per_moment: Mapped[int] = mapped_column(Integer, default=3)
    audios_per_moment: Mapped[int] = mapped_column(Integer, default=1)
    video_max_sec: Mapped[int] = mapped_column(Integer, default=10)
    recurrent_moment_limit: Mapped[int] = mapped_column(Integer, default=5)
    guestbook_default_limit: Mapped[int] = mapped_column(Integer, default=50)
    guestbook_allow_media: Mapped[bool] = mapped_column(Boolean, default=False)
    rev: Mapped[int] = mapped_column(Integer, default=1)

    account: Mapped[Account] = relationship(back_populates="policy")


# =============================================================================
# B2B2C Models: Partner, Voucher, Delivery
# =============================================================================


class Partner(TimestampMixin, SoftDeleteMixin, Base):
    """
    Parceiro B2B2C que pode adquirir vouchers em bulk para distribuir
    a beneficiários (ex: maternidades, fotógrafos, empresas).
    
    Fluxo Portal do Parceiro:
    - Fotógrafo se cadastra e recebe role 'photographer' no User
    - Compra créditos (voucher_balance) em pacotes
    - Cria entregas, faz upload client-side, gera vouchers
    - Acompanha resgates no dashboard
    """
    __tablename__ = "partners"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    
    # Link com o User que controla este partner (role='photographer')
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cnpj: Mapped[str | None] = mapped_column(String(18), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(partner_status_enum, default="pending_approval")
    contact_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Saldo de vouchers disponíveis para criar entregas
    voucher_balance: Mapped[int] = mapped_column(Integer, default=0)
    
    # Configurações do parceiro
    partner_metadata: Mapped[dict[str, Any] | None] = mapped_column("metadata", JSON, nullable=True, default=dict)

    user: Mapped["User | None"] = relationship()
    vouchers: Mapped[list["Voucher"]] = relationship(back_populates="partner", cascade="all,delete-orphan")
    deliveries: Mapped[list["Delivery"]] = relationship(back_populates="partner", cascade="all,delete-orphan")


class Voucher(TimestampMixin, Base):
    """
    Voucher de acesso que pode ser resgatado por um beneficiário para
    criar uma conta ou receber assets transferidos de um parceiro.
    """
    __tablename__ = "vouchers"
    __table_args__ = (
        # Mantemos um único índice/constraint de unicidade para evitar
        # duplicidade na geração do schema (ex.: testes com SQLite via create_all).
        Index("ix_vouchers_code", "code", unique=True),
        Index("ix_vouchers_status_expires", "status", "expires_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    partner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("partners.id", ondelete="CASCADE"),
        index=True,
    )
    code: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(voucher_status_enum, default="available")
    discount_cents: Mapped[int] = mapped_column(Integer, default=0)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    uses_limit: Mapped[int] = mapped_column(Integer, default=1)
    uses_count: Mapped[int] = mapped_column(Integer, default=0)
    beneficiary_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True,
    )
    redeemed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    delivery_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("deliveries.id", ondelete="SET NULL"),
        nullable=True,
    )
    voucher_metadata: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        MutableDict.as_mutable(JSON),
        nullable=True,
        default=dict,
    )

    partner: Mapped[Partner] = relationship(back_populates="vouchers")
    beneficiary: Mapped["Account | None"] = relationship()
    delivery: Mapped["Delivery | None"] = relationship(back_populates="voucher", foreign_keys=[delivery_id])


class Delivery(TimestampMixin, Base):
    """
    Entrega de assets de um parceiro para um beneficiário.
    Representa o pacote de fotos/vídeos que um parceiro prepara
    para entregar junto com um voucher.
    
    Fluxo:
    1. Partner cria delivery com client_name
    2. Faz upload client-side (compressão no browser)
    3. assets_payload armazena paths temporários no storage (R2-only)
    4. Sistema gera voucher_code automaticamente
    5. Quando beneficiário resgata, assets movem de tmp/ para user/
    """
    __tablename__ = "deliveries"
    __table_args__ = (
        Index("ix_deliveries_partner_status", "partner_id", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    partner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("partners.id", ondelete="CASCADE"),
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200))
    client_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(delivery_status_enum, default="draft")

    # Golden Record: credit lifecycle for this delivery
    credit_status: Mapped[str] = mapped_column(delivery_credit_status_enum, default="reserved")
    
    # Armazena os caminhos dos arquivos no bucket temporário
    # Ex: ["tmp/partner_id/delivery_id/foto1.jpg", ...]
    assets_payload: Mapped[dict[str, Any] | None] = mapped_column(
        MutableDict.as_mutable(JSON),
        nullable=True,
        default=dict,
    )
    
    # Código do voucher gerado automaticamente
    generated_voucher_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)

    # Hard lock: e-mail destino da entrega (resgate/importação só com este e-mail)
    target_email: Mapped[str | None] = mapped_column(String(180), nullable=True, index=True)
    
    beneficiary_email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    beneficiary_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    beneficiary_phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    target_account_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("accounts.id", ondelete="SET NULL"),
        nullable=True,
    )
    assets_transferred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Arquivamento pelo fotógrafo (soft delete - não afeta visualização do cliente)
    # Quando preenchido, a entrega fica oculta na listagem do fotógrafo
    archived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    
    delivery_metadata: Mapped[dict[str, Any] | None] = mapped_column(
        "metadata",
        MutableDict.as_mutable(JSON),
        nullable=True,
        default=dict,
    )

    partner: Mapped[Partner] = relationship(back_populates="deliveries")
    target_account: Mapped["Account | None"] = relationship()
    voucher: Mapped["Voucher | None"] = relationship(
        back_populates="delivery",
        foreign_keys="Voucher.delivery_id",
        uselist=False,
    )
    assets: Mapped[list["DeliveryAsset"]] = relationship(back_populates="delivery", cascade="all,delete-orphan")


class PartnerLedger(Base):
    """Auditoria de movimentos de crédito do parceiro.

    Exemplos:
    - reservation: -1 quando uma entrega é criada (crédito reservado)
    - refund: +1 quando o cliente vincula a um Child existente (estorno)
    - purchase: +10 quando o parceiro compra um pacote de créditos
    """

    __tablename__ = "partners_ledger"
    __table_args__ = (
        Index("ix_partners_ledger_partner_created", "partner_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    partner_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("partners.id", ondelete="CASCADE"),
        index=True,
    )
    amount: Mapped[int] = mapped_column(Integer)
    type: Mapped[str] = mapped_column(partner_ledger_type_enum)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow,
    )

    partner: Mapped[Partner] = relationship()


class DeliveryAsset(TimestampMixin, Base):
    """
    Associação entre uma entrega e seus assets.
    Permite rastrear quais assets foram incluídos em uma entrega
    e se já foram transferidos para a conta do beneficiário.
    """
    __tablename__ = "delivery_assets"
    __table_args__ = (
        UniqueConstraint("delivery_id", "asset_id", name="uq_delivery_asset"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    delivery_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("deliveries.id", ondelete="CASCADE"),
        index=True,
    )
    asset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("assets.id", ondelete="CASCADE"),
        index=True,
    )
    position: Mapped[int] = mapped_column(Integer, default=0)
    transferred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    target_asset_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("assets.id", ondelete="SET NULL"),
        nullable=True,
    )

    delivery: Mapped[Delivery] = relationship(back_populates="assets")
    asset: Mapped[Asset] = relationship(foreign_keys=[asset_id])
    target_asset: Mapped[Asset | None] = relationship(foreign_keys=[target_asset_id])
