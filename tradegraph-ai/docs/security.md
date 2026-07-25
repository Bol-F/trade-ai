# Security

## Controls

- JWT access and rotating refresh tokens use HttpOnly cookies; production cookies are
  Secure, SameSite, and scoped to the API/auth paths. Login and registration first use
  a CSRF bootstrap endpoint; all cookie-authenticated unsafe requests require CSRF.
- CORS is an explicit allowlist with credentials. Security, clickjacking, and content
  headers are set by Django/Next production configuration.
- Login and API throttles reduce brute force and abusive workloads.
- Workspace, saved analysis, watchlist, comparison, and export querysets always filter
  by authenticated owner. Export creation rechecks analysis ownership; downloads use
  opaque IDs, owner authorization, expiration, private/no-store caching, and no public
  object URL.
- Admin endpoints require the admin role. Deactivated accounts fail authentication.
- Serializers expose allowlisted fields, preventing owner/status/content mass assignment.
- CSV cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return are prefixed to
  prevent spreadsheet formula injection.
- External URLs come from administrator configuration, use bounded timeouts, and should
  be restricted to HTTPS allowlisted hosts in production. Redirect targets, credentials,
  ports, download sizes, expanded ZIP sizes, and compression ratios are validated.
  Artifact and storage paths are
  server-generated; user input must never become a filesystem path.
- Structured logs contain identifiers, timing, and status—not passwords, cookies, JWTs,
  API keys, Authorization headers, request bodies, private URLs, or export content.

## Operational practice

Rotate Django, database, source API, Redis, and object-storage secrets independently.
Revoke old values, restart workloads, invalidate sessions when signing material changes,
and verify health. Run `pip-audit`/`uv audit` and `npm audit` in CI, triage severity and
exploitability, and pin remediated lockfiles. Review CORS/CSRF origins and admin accounts
each release. Security events and object access should be retained according to policy.

Prometheus metrics require `METRICS_BEARER_TOKEN` outside development/test. Production
startup refuses the development Django secret, a blank database password, or a missing
metrics token. Both frontend and API responses set defense-in-depth security headers.

Known residual risks: statistical results can be misinterpreted; annual trade data can
contain reporting errors; synchronous small exports are stored in PostgreSQL. Large
exports require the authorized background-worker path before production-scale use.
