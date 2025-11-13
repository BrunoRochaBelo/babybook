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
    Index,
    ForeignKey,
    Integer,
    String,
    Text,
    Uuid,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


moment_status_enum = Enum("draft", "published", "archived", name="moment_status_enum")
moment_privacy_enum = Enum("private", "people", "public", name="moment_privacy_enum")
guestbook_status_enum = Enum("pending", "approved", "hidden", name="guestbook_status_enum")
asset_kind_enum = Enum("photo", "video", "audio", name="asset_kind_enum")
asset_status_enum = Enum("queued", "processing", "ready", "failed", name="asset_status_enum")
vault_kind_enum = Enum("certidao", "cpf_rg", "sus_plano", "outro", name="vault_kind_enum")


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
    payload: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True, default=dict)
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
    __table_args__ = (UniqueConstraint("account_id", "sha256", name="uq_asset_account_sha256"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=_generate_uuid)
    account_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("accounts.id", ondelete="CASCADE"))
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
    etags: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True, default=list)
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
    payload: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict)
    job_metadata: Mapped[dict[str, Any]] = mapped_column("metadata", JSON, default=dict)
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
    currency: Mapped[str | None] = mapped_column(String(16), nullable=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSON)

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
    limits: Mapped[dict[str, Any]] = mapped_column(JSON)
    rules: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    prompt_microcopy: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    data_schema: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    ui_schema: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
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
