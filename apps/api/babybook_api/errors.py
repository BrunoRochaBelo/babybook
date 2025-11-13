from __future__ import annotations

from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette import status
from starlette.exceptions import HTTPException as StarletteHTTPException

from .observability import TRACE_ID_HEADER, get_trace_id


def _serialize_error(
    *,
    trace_id: str,
    code: str,
    message: str,
    details: Any | None = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "trace_id": trace_id,
        }
    }
    if details is not None:
        payload["error"]["details"] = details
    return payload


class AppError(HTTPException):
    def __init__(
        self,
        *,
        status_code: int,
        code: str,
        message: str,
        details: Any | None = None,
    ) -> None:
        super().__init__(status_code=status_code)
        self.code = code
        self.message = message
        self.details = details


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    trace_id = get_trace_id(request)
    response = JSONResponse(
        status_code=exc.status_code,
        content=_serialize_error(
            trace_id=trace_id,
            code=exc.code,
            message=exc.message,
            details=exc.details,
        ),
    )
    response.headers[TRACE_ID_HEADER] = trace_id
    return response


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    trace_id = get_trace_id(request)
    detail = exc.detail

    code = f"http.{exc.status_code}"
    message = "HTTP error"
    details: Any | None = None

    if isinstance(detail, str):
        message = detail
    elif isinstance(detail, dict):
        details = detail
    elif detail is None:
        message = HTTPException(status_code=exc.status_code).detail or "HTTP error"

    response = JSONResponse(
        status_code=exc.status_code,
        content=_serialize_error(trace_id=trace_id, code=code, message=message, details=details),
    )
    response.headers[TRACE_ID_HEADER] = trace_id
    return response


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    trace_id = get_trace_id(request)
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_serialize_error(
            trace_id=trace_id,
            code="request.validation_error",
            message="Payload invalido",
            details=exc.errors(),
        ),
    )
    response.headers[TRACE_ID_HEADER] = trace_id
    return response


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    trace_id = get_trace_id(request)
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_serialize_error(
            trace_id=trace_id,
            code="server.unexpected",
            message="Erro interno inesperado.",
        ),
    )
    response.headers[TRACE_ID_HEADER] = trace_id
    return response

