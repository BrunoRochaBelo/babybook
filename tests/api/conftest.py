from __future__ import annotations

import asyncio

import pytest

from babybook_api.tests import conftest as api_conftest


@pytest.fixture(autouse=True)
def contract_db_setup() -> None:
    asyncio.run(api_conftest._reset_db())
    asyncio.run(api_conftest._seed_default_user())
