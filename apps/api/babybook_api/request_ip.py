from __future__ import annotations

import ipaddress

from fastapi import Request

from babybook_api.settings import settings


def _is_trusted_proxy(remote_ip: str) -> bool:
    # Dev convenience: in local, if no allowlist is configured, accept X-Forwarded-For.
    if settings.app_env == "local" and not settings.trusted_proxy_ips:
        return True

    if not settings.trusted_proxy_ips:
        return False

    try:
        addr = ipaddress.ip_address(remote_ip)
    except ValueError:
        return False

    for entry in settings.trusted_proxy_ips:
        e = (entry or "").strip()
        if not e:
            continue
        if e == "*":
            return True
        try:
            if "/" in e:
                net = ipaddress.ip_network(e, strict=False)
                if addr in net:
                    return True
            else:
                if addr == ipaddress.ip_address(e):
                    return True
        except ValueError:
            # Ignore malformed entries
            continue

    return False


def get_client_ip(request: Request) -> str:
    """Return the best-effort client IP with anti-spoofing.

    - Uses request.client.host by default.
    - Uses X-Forwarded-For ONLY if the immediate peer is a trusted proxy.

    This prevents attackers from spoofing client identity (rate limiting, audit logs)
    by sending arbitrary X-Forwarded-For.
    """

    remote_ip = request.client.host if request.client else "unknown"

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded and remote_ip != "unknown" and _is_trusted_proxy(remote_ip):
        # "client, proxy1, proxy2" -> client
        candidate = forwarded.split(",", 1)[0].strip()
        try:
            ipaddress.ip_address(candidate)
            return candidate
        except ValueError:
            # Ignore invalid forwarded IPs
            pass

    return remote_ip
