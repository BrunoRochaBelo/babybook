from __future__ import annotations

from babybook_api.settings import settings

# Cookie prefix rules:
# - "__Host-" cookies MUST be Secure and MUST NOT set Domain.
#   Browsers will reject them over plain HTTP.
# - Locally (HTTP), we use a simple cookie name so Playwright/browser sessions work.
SESSION_COOKIE_NAME = "__Host-session" if settings.session_cookie_secure else "bb_session"
