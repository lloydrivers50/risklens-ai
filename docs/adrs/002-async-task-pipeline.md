# ADR 002: Async Task Pipeline with SQS

## Status
Accepted

## Date
2026-04-10

## Context

Document processing tasks (extraction, summarisation, risk assessment) are not instant. A single PDF extraction can take 10-30 seconds depending on document length, model choice, and current API latency.

If we process synchronously, the client waits for the full duration. Under load, this blocks API workers and degrades the entire service.

## Decision

Implement an async task pipeline:
1. API receives request, validates input, uploads document to S3
2. API pushes a task message to AWS SQS and returns a task ID immediately
3. A background worker consumes from SQS and processes the task via the LLM gateway
4. Results are stored and task status is updated
5. Client polls for results using the task ID

All Python code uses asyncio natively — every I/O operation (S3 upload, SQS publish, LLM call) is awaited, never blocking.

## Consequences

### Positive
- **Non-blocking API** — responds in milliseconds, processing happens in the background
- **Scalable** — add more workers to increase throughput without touching the API
- **Resilient** — SQS provides automatic retry, dead-letter queues for failed tasks
- **Observable** — queue depth is a direct measure of system load
- **Decoupled** — API and workers are independent; either can be deployed/scaled separately

### Negative
- **Eventual consistency** — client must poll for results (not instant)
- **Added infrastructure** — SQS adds an AWS dependency and operational surface
- **Complexity** — more moving parts than a synchronous request/response

### Risks
- SQS message ordering is not guaranteed (standard queues) — tasks may complete out of order
- Need to handle duplicate messages (SQS at-least-once delivery)

## Alternatives Considered

**Synchronous processing**: Simpler but blocks under load. Not viable for production at scale.

**Redis/Celery queue**: Popular Python pattern but adds Redis as a dependency. SQS is serverless, fully managed, and requires no infrastructure to maintain.

**WebSockets for real-time updates**: Could add later as an enhancement on top of the polling model. Not needed for MVP.
