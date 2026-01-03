
"""update_guest_invites_schema

Revision ID: 34b05ce16909
Revises: 8a5f5f4c0ea3
Create Date: 2026-01-02 20:04:44.368488

"""


from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '34b05ce16909'
down_revision = '8a5f5f4c0ea3'
branch_labels = None
depends_on = None



def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "guest_invites" not in tables:
        # Table missing (despite 0013), create it with NEW schema
        op.create_table(
            "guest_invites",
            sa.Column("id", sa.Uuid(), primary_key=True),
            sa.Column("child_id", sa.Uuid(), sa.ForeignKey("children.id"), nullable=False),
            sa.Column("inviter_id", sa.Uuid(), sa.ForeignKey("accounts.id"), nullable=False),
            sa.Column("invitee_email", sa.String(255), nullable=False),
            sa.Column("token_hash", sa.String(255), nullable=False),
            sa.Column("status", sa.String(20), server_default=sa.text("'pending'")),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now())
        )
    else:
        # Table exists (0013 applied), alter it
        # 1. Add status
        # Check if status exists first to be safe
        columns = [c['name'] for c in inspector.get_columns("guest_invites")]
        if "status" not in columns:
            op.add_column("guest_invites", sa.Column("status", sa.String(20), server_default=sa.text("'pending'")))

        # 2. Renames
        if "account_id" in columns:
            op.execute('ALTER TABLE guest_invites RENAME COLUMN account_id TO inviter_id')
        if "invited_email" in columns:
            op.execute('ALTER TABLE guest_invites RENAME COLUMN invited_email TO invitee_email')
        if "token" in columns:
            op.execute('ALTER TABLE guest_invites RENAME COLUMN token TO token_hash')

        # 3. Alter types
        op.alter_column("guest_invites", "invitee_email", nullable=False, type_=sa.String(255))
        op.alter_column("guest_invites", "token_hash", type_=sa.String(255))


def downgrade() -> None:
    # Revert changes
    op.alter_column("guest_invites", "token_hash", type_=sa.String(64))
    op.execute('ALTER TABLE guest_invites RENAME COLUMN token_hash TO token')
    
    op.alter_column("guest_invites", "invitee_email", nullable=True, type_=sa.String(180))
    op.execute('ALTER TABLE guest_invites RENAME COLUMN invitee_email TO invited_email')
    
    op.execute('ALTER TABLE guest_invites RENAME COLUMN inviter_id TO account_id')
    
    op.drop_column("guest_invites", "status")
