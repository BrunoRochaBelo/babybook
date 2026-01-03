"""Guestbook invites + relationship degree + asset attachment

Revision ID: 0013_guestbook_invites_relationship_degree
Revises: 0012_upload_sessions_storage_upload_id, 65e767b851f7
Create Date: 2026-01-02

"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "0013_guestbook_invites_relationship_degree"
down_revision: Union[str, tuple[str, ...], None] = (
    "0012_upload_sessions_storage_upload_id",
    "65e767b851f7",
)
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _guestbook_relationship_enum(bind):
    if bind.dialect.name == "postgresql":
        enum = postgresql.ENUM(
            "mae",
            "pai",
            "tio",
            "tia",
            "irmao_irma",
            "avo",
            "avoa",
            "amigo",
            "madrasta",
            "padrasto",
            name="guestbook_relationship_enum",
            create_type=False,
        )
        enum.create(bind, checkfirst=True)
        return enum

    return sa.Enum(
        "mae",
        "pai",
        "tio",
        "tia",
        "irmao_irma",
        "avo",
        "avoa",
        "amigo",
        "madrasta",
        "padrasto",
        name="guestbook_relationship_enum",
    )


def upgrade() -> None:
    bind = op.get_bind()
    guestbook_relationship_enum = _guestbook_relationship_enum(bind)

    op.create_table(
        "guestbook_invites",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("child_id", sa.Uuid(), nullable=False),
        sa.Column("token", sa.String(length=64), nullable=False),
        sa.Column("invited_email", sa.String(length=180), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
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
        sa.ForeignKeyConstraint(["account_id"], ["accounts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["child_id"], ["children.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("token", name="uq_guestbook_invites_token"),
    )
    op.create_index(
        "ix_guestbook_invites_token", "guestbook_invites", ["token"], unique=True
    )

    op.add_column(
        "guestbook_entries",
        sa.Column(
            "invite_id",
            sa.Uuid(),
            sa.ForeignKey("guestbook_invites.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )
    op.add_column(
        "guestbook_entries",
        sa.Column(
            "asset_id",
            sa.Uuid(),
            sa.ForeignKey("assets.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )

    # relationship_degree é obrigatório no modelo. Para não quebrar dados legados,
    # preenchermos entradas existentes com um default seguro.
    op.add_column(
        "guestbook_entries",
        sa.Column(
            "relationship_degree",
            guestbook_relationship_enum,
            nullable=False,
            server_default="amigo",
        ),
    )


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_column("guestbook_entries", "relationship_degree")
    op.drop_column("guestbook_entries", "asset_id")
    op.drop_column("guestbook_entries", "invite_id")

    op.drop_index("ix_guestbook_invites_token", table_name="guestbook_invites")
    op.drop_table("guestbook_invites")

    if bind.dialect.name == "postgresql":
        enum = postgresql.ENUM(
            "mae",
            "pai",
            "tio",
            "tia",
            "irmao_irma",
            "avo",
            "avoa",
            "amigo",
            "madrasta",
            "padrasto",
            name="guestbook_relationship_enum",
            create_type=False,
        )
        enum.drop(bind, checkfirst=True)
