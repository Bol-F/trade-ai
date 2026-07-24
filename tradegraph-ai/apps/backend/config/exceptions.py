from typing import Any

from rest_framework.exceptions import APIException, ValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    response = exception_handler(exc, context)
    if response is None:
        return None

    code = "VALIDATION_ERROR" if isinstance(exc, ValidationError) else "API_ERROR"
    if isinstance(exc, APIException) and not isinstance(exc, ValidationError):
        code = str(exc.default_code).upper()
    message = "Request validation failed." if isinstance(exc, ValidationError) else str(exc)
    response.data = {"error": {"code": code, "message": message, "details": response.data}}
    return response
