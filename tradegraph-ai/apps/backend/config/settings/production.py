from django.core.exceptions import ImproperlyConfigured

from config.settings.base import *  # noqa: F403

DEBUG = False
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
AUTH_COOKIE_SECURE = True
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
DATABASES["default"]["OPTIONS"] = {"options": "-c statement_timeout=30000"}  # noqa: F405

if SECRET_KEY.startswith("unsafe-development-") or len(SECRET_KEY) < 50:  # noqa: F405
    raise ImproperlyConfigured("DJANGO_SECRET_KEY must be a strong production-only value.")
if not DATABASES["default"]["PASSWORD"]:  # noqa: F405
    raise ImproperlyConfigured("POSTGRES_PASSWORD is required in production.")
if not METRICS_BEARER_TOKEN:  # noqa: F405
    raise ImproperlyConfigured("METRICS_BEARER_TOKEN is required in production.")
if AUTH_COOKIE_SAMESITE == "None" and not AUTH_COOKIE_SECURE:  # noqa: F405
    raise ImproperlyConfigured("SameSite=None authentication cookies must be Secure.")
