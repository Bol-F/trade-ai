from django.conf import settings
from django.utils import translation
from django.utils.translation import get_language_info
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


def language_payload(language: str) -> dict[str, object]:
    return {
        "language": language,
        "language_name": get_language_info(language)["name_local"],
        "available_languages": [
            {"code": code, "name": get_language_info(code)["name_local"]}
            for code, _name in settings.LANGUAGES
        ],
    }


class LanguagePreferenceView(APIView):
    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    def get(self, request: Request) -> Response:
        language = translation.get_language() or settings.LANGUAGE_CODE
        return Response(language_payload(language))

    def post(self, request: Request) -> Response:
        requested = str(request.data.get("language", "")).lower()
        supported = {code for code, _name in settings.LANGUAGES}
        if requested not in supported:
            return Response(
                {
                    "error": {
                        "code": "UNSUPPORTED_LANGUAGE",
                        "message": "Supported languages are en and ru.",
                        "details": {"supported": sorted(supported)},
                    }
                },
                status=400,
            )

        translation.activate(requested)
        response = Response(language_payload(requested))
        response.set_cookie(
            settings.LANGUAGE_COOKIE_NAME,
            requested,
            max_age=365 * 24 * 60 * 60,
            path=settings.LANGUAGE_COOKIE_PATH,
            secure=settings.LANGUAGE_COOKIE_SECURE,
            httponly=settings.LANGUAGE_COOKIE_HTTPONLY,
            samesite=settings.LANGUAGE_COOKIE_SAMESITE,
        )
        return response
