from django.http import HttpRequest, HttpResponse
from rest_framework import exceptions
from rest_framework.authentication import CSRFCheck
from rest_framework.request import Request
from rest_framework_simplejwt.authentication import JWTAuthentication


def _dummy_response(request: HttpRequest) -> HttpResponse:
    return HttpResponse()


def enforce_csrf(request: Request) -> None:
    check = CSRFCheck(_dummy_response)
    check.process_request(request._request)
    reason = check.process_view(request._request, None, (), {})  # type: ignore[arg-type]
    if reason:
        raise exceptions.PermissionDenied(f"CSRF validation failed: {reason}")


class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request: Request):  # type: ignore[no-untyped-def]
        header = self.get_header(request)
        raw_token = self.get_raw_token(header) if header is not None else None
        cookie_authenticated = raw_token is None
        if raw_token is None:
            cookie_token = request.COOKIES.get("access_token")
            raw_token = cookie_token.encode() if cookie_token else None
        if raw_token is None:
            return None
        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        if cookie_authenticated and request.method not in {"GET", "HEAD", "OPTIONS", "TRACE"}:
            enforce_csrf(request)
        return user, validated_token
