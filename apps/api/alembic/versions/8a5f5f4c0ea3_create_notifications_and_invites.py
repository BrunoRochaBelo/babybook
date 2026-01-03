
"""create_notifications_and_invites

Revision ID: 8a5f5f4c0ea3
Revises: 0013_guestbook_invites_relationship_degree
Create Date: 2026-01-02 19:55:50.460890

"""


from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '8a5f5f4c0ea3'
down_revision = '0013_guestbook_invites_relationship_degree'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create notifications table
    # Removed server_default for id to match project pattern (application-side generation)
    # and avoid extension dependency issues.
    op.create_table(
        "notifications",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("accounts.id"), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("title", sa.String(150), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("action_link", sa.String(255), nullable=True),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now())
    )
    
    # Conditional index for unread notifications
    op.create_index(
        "idx_notifications_user_unread", 
        "notifications", 
        ["user_id"], 
        postgresql_where=sa.text("is_read = FALSE")
    )

    # 2. Modify guest_invites to match requested schema
    # Rename account_id -> inviter_id
    # op.alter_column("guest_invites", "account_id", new_column_name="inviter_id")
    
    # Rename invited_email -> invitee_email, make NOT NULL, resize to 255
    # op.alter_column("guest_invites", "invited_email", new_column_name="invitee_email")
    # op.alter_column("guest_invites", "invitee_email", nullable=False, type_=sa.String(255))
    
    # Rename token -> token_hash, resize to 255
    # op.alter_column("guest_invites", "token", new_column_name="token_hash")
    # op.alter_column("guest_invites", "token_hash", type_=sa.String(255))
    
    # Add status column with safe text default
    # op.add_column("guest_invites", sa.Column("status", sa.String(20), server_default=sa.text("'pending'")))


def downgrade() -> None:
    # 1. Revert guest_invites
    op.drop_column("guest_invites", "status")
    
    op.alter_column("guest_invites", "token_hash", type_=sa.String(64))
    op.alter_column("guest_invites", "token_hash", new_column_name="token")
    
    op.alter_column("guest_invites", "invitee_email", nullable=True, type_=sa.String(180))
    op.alter_column("guest_invites", "invitee_email", new_column_name="invited_email")
    
    op.alter_column("guest_invites", "inviter_id", new_column_name="account_id")

    # 2. Drop notifications
    op.drop_index("idx_notifications_user_unread", table_name="notifications")
    op.drop_table("notifications")
