from __future__ import annotations

import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

TRACE_ID_HEADER = "X-Trace-Id"


def _generate_suffix() -> str:
    # 12 chars mantem o cabecalho curto e ainda garante unicidade.
    return uuid.uuid4().hex[:12]


def new_trace_id() -> str:
    return f"bb-trace-{_generate_suffix()}"


def get_trace_id(request: Request) -> str:
    trace_id = getattr(request.state, "trace_id", None)
    if trace_id is None:
        trace_id = new_trace_id()
        request.state.trace_id = trace_id
    return trace_id


class TraceIdMiddleware(BaseHTTPMiddleware):
    """
    Gera um trace-id por requisicao e injeta no estado e no cabecalho X-Trace-Id.
    Necessario para cumprir a Convencao 4.2 (Erro Canonico + rastreabilidade).
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        trace_id = new_trace_id()
        request.state.trace_id = trace_id
        response = await call_next(request)
        response.headers.setdefault(TRACE_ID_HEADER, trace_id)
        return response
