from django.contrib.auth import update_session_auth_hash
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.authentication import enforce_csrf
from accounts.models import User
from accounts.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegistrationSerializer,
    UserSerializer,
)
from accounts.tokens import REFRESH_COOKIE, clear_auth_cookies, set_auth_cookies


def _blacklist_cookie(request: Request) -> None:
    raw_refresh = request.COOKIES.get(REFRESH_COOKIE)
    if raw_refresh:
        try:
            RefreshToken(raw_refresh).blacklist()  # type: ignore[arg-type]
        except TokenError:
            return


def _authenticated_user(request: Request) -> User:
    if not isinstance(request.user, User):
        raise TypeError("Authenticated request does not contain a TradeGraph user.")
    return request.user


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(request=RegistrationSerializer, responses={201: UserSerializer})
    def post(self, request: Request) -> Response:
        enforce_csrf(request)
        serializer = RegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        response = Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        get_token(request._request)
        set_auth_cookies(response, RefreshToken.for_user(user))
        return response


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    @extend_schema(request=LoginSerializer, responses={200: UserSerializer})
    def post(self, request: Request) -> Response:
        enforce_csrf(request)
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        response = Response(UserSerializer(user).data)
        get_token(request._request)
        set_auth_cookies(response, RefreshToken.for_user(user))
        return response


class RefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        request=None,
        responses=inline_serializer("RefreshResponse", {"status": serializers.CharField()}),
    )
    def post(self, request: Request) -> Response:
        enforce_csrf(request)
        raw_refresh = request.COOKIES.get(REFRESH_COOKIE)
        if not raw_refresh:
            return Response(
                {
                    "error": {
                        "code": "REFRESH_TOKEN_MISSING",
                        "message": "Refresh token is missing.",
                        "details": {},
                    }
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            old_refresh = RefreshToken(raw_refresh)  # type: ignore[arg-type]
            user = get_object_or_404(User, pk=old_refresh["user_id"], is_active=True)
            old_refresh.blacklist()
            new_refresh = RefreshToken.for_user(user)
        except TokenError:
            return Response(
                {
                    "error": {
                        "code": "REFRESH_TOKEN_INVALID",
                        "message": "Refresh token is invalid or expired.",
                        "details": {},
                    }
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )
        response = Response({"status": "refreshed"})
        set_auth_cookies(response, new_refresh)
        return response


class LogoutView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=None, responses={204: None})
    def post(self, request: Request) -> Response:
        enforce_csrf(request)
        _blacklist_cookie(request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


class CsrfTokenView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    def get(self, request: Request) -> Response:
        return Response({"csrf_token": get_token(request._request)})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(responses=UserSerializer)
    def get(self, request: Request) -> Response:
        return Response(UserSerializer(_authenticated_user(request)).data)

    @extend_schema(request=UserSerializer, responses=UserSerializer)
    def patch(self, request: Request) -> Response:
        serializer = UserSerializer(_authenticated_user(request), data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(responses={204: None})
    def delete(self, request: Request) -> Response:
        user = _authenticated_user(request)
        user.is_active = False
        user.save(update_fields=["is_active", "updated_at"])
        _blacklist_cookie(request)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_auth_cookies(response)
        return response


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        request=ChangePasswordSerializer,
        responses=inline_serializer("ChangePasswordResponse", {"status": serializers.CharField()}),
    )
    def post(self, request: Request) -> Response:
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = _authenticated_user(request)
        if not user.check_password(serializer.validated_data["current_password"]):
            return Response(
                {
                    "error": {
                        "code": "CURRENT_PASSWORD_INVALID",
                        "message": "Current password is incorrect.",
                        "details": {},
                    }
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        update_session_auth_hash(request, user)
        _blacklist_cookie(request)
        response = Response({"status": "password_changed"})
        set_auth_cookies(response, RefreshToken.for_user(user))
        return response
