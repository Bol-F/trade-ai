# Backup and recovery

PostgreSQL is the system of record. Take encrypted daily logical backups plus provider
PITR/WAL where available; retain and test per policy. Back up object storage with bucket
versioning/replication, including model artifacts and large export objects. Redis is a
cache/broker, not the source of analytical truth; persistence may reduce task loss but
queued tasks must be retryable and idempotent.

Record checksums, encryption key version, completion status and restore-test evidence.
Keep backups in a separate failure domain with least-privilege access. Never place
database dumps or object credentials in the repository.

Quarterly restore drill:

1. Provision isolated PostgreSQL/object storage with no production egress.
2. Restore the chosen database point and objects.
3. Run migrations only after confirming application-version compatibility.
4. Verify row counts, checksums, owner permissions, active dataset/model references,
   login, Explorer and a forecast.
5. Document achieved RPO/RTO and destroy the isolated environment securely.
