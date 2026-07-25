# Disaster recovery

Target objectives must be approved by the operator; an initial planning target is RPO
24 hours without PITR (minutes with healthy WAL archiving) and RTO 4 hours.

Declare an incident for regional loss, unrecoverable database corruption, leaked signing
secrets, or prolonged dependency loss. Freeze deployments and dataset/model promotion,
assign an incident lead, preserve logs, and communicate known user impact without
speculation.

Recovery order: networking/secrets, PostgreSQL, object storage, Redis, migrations, API,
workers, frontend. Restore the database and matching artifact snapshot, validate
checksums and ownership isolation, select known-good dataset/model versions, rotate
compromised secrets, then enable traffic gradually. Requeue only idempotent tasks;
failed partial ingestion stays non-active.

After recovery, reconcile missing imports/exports, invalidate stale sessions and cached
data, review audit events, document timeline/root cause, and turn every corrective action
into an owned issue and tested runbook update.
