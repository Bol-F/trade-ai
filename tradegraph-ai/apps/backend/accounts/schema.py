from drf_spectacular.extensions import OpenApiAuthenticationExtension


class CookieJWTAuthenticationScheme(OpenApiAuthenticationExtension):  # type: ignore[no-untyped-call]
    target_class = "accounts.authentication.CookieJWTAuthentication"
    name = "cookieJwt"

    def get_security_definition(self, auto_schema):  # type: ignore[no-untyped-def]
        return {
            "type": "apiKey",
            "in": "cookie",
            "name": "access_token",
            "description": "Short-lived JWT access token stored in an HttpOnly cookie.",
        }
