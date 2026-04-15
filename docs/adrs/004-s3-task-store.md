# ADR-004: S3 as Task Metadata Store

## Status

Accepted

## Context

The extraction pipeline uses a producer/consumer pattern: the API process enqueues tasks via SQS, and a separate worker process consumes them. Both processes need to read and write task metadata (status, results, metrics).

The initial implementation used an in-memory Python dictionary (`task_store: dict[str, TaskResponse]`). This worked while everything ran in a single process, but broke under process isolation — the worker and API each had their own empty dict and couldn't share state.

We needed a shared persistence layer. The options considered:

1. **PostgreSQL (RDS)** — full relational database
2. **DynamoDB** — managed NoSQL with fast key-value access
3. **S3 JSON objects** — store task metadata as JSON files alongside documents
4. **Redis** — in-memory shared cache

## Decision

Use S3 as the task metadata store, persisting each task as a JSON object at `tasks/{task_id}.json` in the existing S3 bucket.

## Rationale

- **Zero new infrastructure** — we already have an S3 bucket provisioned via Terraform with encryption, versioning, and lifecycle policies. No new services to deploy, no connection strings to manage, no additional cost.
- **Both processes can access it** — the API and worker use the same S3Client. Process isolation is no longer a problem.
- **Good enough for current scale** — with single-digit concurrent users, S3's latency (~50-100ms per read) is fine. Tasks are read individually by ID (not queried by complex filters).
- **Durability** — S3 provides 99.999999999% durability. Task data won't be lost on process restart, unlike the in-memory dict.

## Trade-offs

- **No indexing or querying** — listing all tasks requires listing S3 objects and reading each one. Acceptable at current scale (<100 tasks), would not scale to thousands.
- **Eventual consistency** — S3 provides strong read-after-write consistency for new objects, but there's a brief window where a task saved by the API might not be visible to the worker. The worker handles this gracefully by creating the task from the SQS message if not found.
- **Not suitable for production scale** — a real production system would use PostgreSQL for task metadata (indexing, filtering, aggregation for metrics).

## Migration Path

When the system outgrows S3 as a task store:

1. Provision PostgreSQL via Terraform (RDS or a managed instance)
2. Replace `TaskStore` class internals — the interface (`save`, `get`, `list_tasks`) stays the same
3. Backfill historical tasks from S3 JSON files
4. S3 continues to store documents (PDFs), only metadata moves to the database

The `TaskStore` abstraction makes this a single-class change with no impact on the router or worker.
