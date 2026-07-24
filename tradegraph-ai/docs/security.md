# Security

- JWT access/refresh tokens use HttpOnly cookies; refresh rotates and logout
  revokes. Production cookies are Secure and SameSite.
- CSRF middleware protects cookie-authenticated mutations. Browser tokens are
  never stored in localStorage.
- CORS is an explicit environment allowlist.
- Login, anonymous and authenticated API throttles are enforced.
- Uploads are limited to 10 MiB through Django; BACI imports use server-side paths
  or configured URLs rather than HTTP uploads.
- Admin data health requires the application admin role.
- Authenticated mutations create audit events without request bodies or secrets.
- Structured logs contain IDs/timing/status, never passwords, cookies, JWTs or API
  keys.
- CSV cells beginning with formula-control characters are neutralized for export.
- Production enables HTTPS redirect, HSTS, content-type protection, same-origin
  referrer policy and frame denial.
- PostgreSQL statements have a production timeout.

Run `uv run python scripts/check_secrets.py` before release. Rotate any credential
immediately if it is ever committed; rewriting Git history is not sufficient alone.
