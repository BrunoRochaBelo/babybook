from __future__ import annotations

import pytest
from sqlalchemy import select

seeds = pytest.importorskip("babybook_admin.seeds")
from babybook_api.db.models import Account, AppPolicy, MomentTemplate
from babybook_api.tests.conftest import DATABASE_URL, TestingSessionLocal


@pytest.mark.asyncio
async def test_seed_moment_templates_creates_defaults() -> None:
    inserted = await seeds.seed_moment_templates(database_url=DATABASE_URL)
    assert inserted == len(seeds.MOMENT_TEMPLATES)

    # idempotent run
    inserted_again = await seeds.seed_moment_templates(database_url=DATABASE_URL)
    assert inserted_again == 0

    async with TestingSessionLocal() as session:
        templates = (await session.execute(select(MomentTemplate))).scalars().all()
        assert len(templates) == len(seeds.MOMENT_TEMPLATES)


@pytest.mark.asyncio
async def test_seed_base_plan_policies(default_account_id: str) -> None:
    inserted = await seeds.seed_base_plan_policies(database_url=DATABASE_URL)
    assert inserted == 1

    # idempotent run
    inserted_again = await seeds.seed_base_plan_policies(database_url=DATABASE_URL)
    assert inserted_again == 0

    async with TestingSessionLocal() as session:
        account_count = len((await session.execute(select(Account.id))).scalars().all())
        policies = (await session.execute(select(AppPolicy))).scalars().all()
        assert len(policies) == account_count
        policy = policies[0]
        assert policy.photos_per_moment == seeds.BASE_POLICY["photos_per_moment"]
