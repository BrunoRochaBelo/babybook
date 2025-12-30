"""Add user_notifications and user_preferences tables

Revision ID: 0011
Revises: 0010_delivery_target_child_id
Create Date: 2025-12-30

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0011_user_notifications_preferences"
down_revision: Union[str, None] = "0010_delivery_target_child_id"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create user_notifications table
    # Using String(32) instead of Enum for flexibility and to avoid enum conflicts
    op.create_table(
        "user_notifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("type", sa.String(32), nullable=False),  # milestone, health, etc.
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("link", sa.String(500), nullable=True),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
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
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_user_notifications_user_id", "user_notifications", ["user_id"])
    op.create_index(
        "ix_user_notifications_user_read",
        "user_notifications",
        ["user_id", "read_at"],
    )
    op.create_index(
        "ix_user_notifications_user_created",
        "user_notifications",
        ["user_id", "created_at"],
    )

    # Create user_preferences table
    op.create_table(
        "user_preferences",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("notify_milestones", sa.Boolean(), nullable=False, default=True),
        sa.Column("notify_health", sa.Boolean(), nullable=False, default=True),
        sa.Column("notify_guestbook", sa.Boolean(), nullable=False, default=True),
        sa.Column("notify_memories", sa.Boolean(), nullable=False, default=True),
        sa.Column("notify_photos", sa.Boolean(), nullable=False, default=True),
        sa.Column("notify_gifts", sa.Boolean(), nullable=False, default=True),
        sa.Column("notify_updates", sa.Boolean(), nullable=False, default=False),
        sa.Column("notify_redemptions", sa.Boolean(), nullable=False, default=True),
        sa.Column("notify_credits", sa.Boolean(), nullable=False, default=True),
        sa.Column("push_enabled", sa.Boolean(), nullable=False, default=True),
        sa.Column("email_enabled", sa.Boolean(), nullable=False, default=False),
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
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )


def downgrade() -> None:
    op.drop_table("user_preferences")
    op.drop_index("ix_user_notifications_user_created", table_name="user_notifications")
    op.drop_index("ix_user_notifications_user_read", table_name="user_notifications")
    op.drop_index("ix_user_notifications_user_id", table_name="user_notifications")
    op.drop_table("user_notifications")

