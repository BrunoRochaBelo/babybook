"""Add partner portal fields (voucher_balance, user_id, assets_payload)

Revision ID: 003_partner_portal_fields
Revises: 002_create_b2b2c_tables
Create Date: 2025-12-08
"""
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON, UUID

from alembic import op

# revision identifiers, used by Alembic.
revision = '003_partner_portal_fields'
down_revision = '002_create_b2b2c_tables'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Partner: adiciona user_id, voucher_balance, logo_url
    op.add_column('partners', sa.Column('user_id', UUID(as_uuid=True), nullable=True))
    op.add_column('partners', sa.Column('voucher_balance', sa.Integer(), nullable=False, server_default='0'))
    op.add_column('partners', sa.Column('logo_url', sa.String(500), nullable=True))
    
    op.create_index('ix_partners_user_id', 'partners', ['user_id'])
    op.create_foreign_key(
        'fk_partners_user_id',
        'partners', 'users',
        ['user_id'], ['id'],
        ondelete='SET NULL'
    )
    
    # Atualiza status default para pending_approval (novos parceiros precisam aprovação)
    op.alter_column('partners', 'status',
                    server_default='pending_approval')
    
    # Delivery: adiciona client_name, event_date, assets_payload, generated_voucher_code
    op.add_column('deliveries', sa.Column('client_name', sa.String(200), nullable=True))
    op.add_column('deliveries', sa.Column('event_date', sa.DateTime(timezone=True), nullable=True))
    op.add_column('deliveries', sa.Column('assets_payload', JSON, nullable=True))
    op.add_column('deliveries', sa.Column('generated_voucher_code', sa.String(32), nullable=True))
    
    op.create_index('ix_deliveries_generated_voucher_code', 'deliveries', ['generated_voucher_code'])
    
    # Atualiza status default para draft
    op.alter_column('deliveries', 'status',
                    server_default='draft')


def downgrade() -> None:
    # Delivery
    op.drop_index('ix_deliveries_generated_voucher_code', 'deliveries')
    op.drop_column('deliveries', 'generated_voucher_code')
    op.drop_column('deliveries', 'assets_payload')
    op.drop_column('deliveries', 'event_date')
    op.drop_column('deliveries', 'client_name')
    op.alter_column('deliveries', 'status', server_default='pending')
    
    # Partner
    op.drop_constraint('fk_partners_user_id', 'partners', type_='foreignkey')
    op.drop_index('ix_partners_user_id', 'partners')
    op.drop_column('partners', 'logo_url')
    op.drop_column('partners', 'voucher_balance')
    op.drop_column('partners', 'user_id')
    op.alter_column('partners', 'status', server_default='active')
