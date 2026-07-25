from typing import Literal, cast

from django.conf import settings
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"
ACCESS_COOKIE_PATH = "/api/v1"
REFRESH_COOKIE_PATH = "/api/v1/auth"


def set_auth_cookies(response: Response, refresh: RefreshToken) -> None:
    same_site = cast(Literal["Lax", "Strict", "None"], settings.AUTH_COOKIE_SAMESITE)
    response.set_cookie(
        ACCESS_COOKIE,
        str(refresh.access_token),
        max_age=15 * 60,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=same_site,
        path=ACCESS_COOKIE_PATH,
    )
    response.set_cookie(
        REFRESH_COOKIE,
        str(refresh),
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=same_site,
        path=REFRESH_COOKIE_PATH,
    )


def clear_auth_cookies(response: Response) -> None:
    same_site = cast(Literal["Lax", "Strict", "None"], settings.AUTH_COOKIE_SAMESITE)
    response.delete_cookie(ACCESS_COOKIE, path=ACCESS_COOKIE_PATH, samesite=same_site)
    response.delete_cookie(REFRESH_COOKIE, path=REFRESH_COOKIE_PATH, samesite=same_site)
