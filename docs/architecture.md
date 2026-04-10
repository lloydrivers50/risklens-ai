# Architecture Overview

## System Context

RiskLens AI is a document processing platform for commercial insurance. It sits between insurance document sources (broker submissions, policy wordings, claims) and the underwriters who need structured, actionable data.

The system is designed around a **model-agnostic LLM gateway** — a single service layer that internal consumers call without needing to know which foundation model is doing the work underneath.

## High-Level Architecture

```
                    ┌──────────────┐
                    │   React App  │
                    │  (Dashboard) │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │    nginx     │
                    │  (reverse    │
                    │   proxy)     │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │   FastAPI    │
                    │   Service    │
                    └──┬───┬───┬──┘
                       │   │   │
            ┌──────────┘   │   └──────────┐
            ▼              ▼              ▼
     ┌────────────┐ ┌───────────┐ ┌────────────┐
     │  AWS S3    │ │  AWS SQS  │ │ CloudWatch │
     │  (docs)    │ │  (tasks)  │ │ (metrics)  │
     └────────────┘ └─────┬─────┘ └────────────┘
                          │
                   ┌──────▼───────┐
                   │  Task Worker │
                   │  (consumer)  │
                   └──────┬───────┘
                          │
                   ┌──────▼───────┐
                   │  LLM Gateway │
                   │              │
                   │ ┌──────────┐ │
                   │ │ Claude   │ │
                   │ ├──────────┤ │
                   │ │ GPT-4o   │ │
                   │ ├──────────┤ │
                   │ │ Local    │ │
                   │ └──────────┘ │
                   └──────────────┘
```

## Component Breakdown

### 1. API Layer (FastAPI)

The main entry point. All requests come through here.

- **Framework**: FastAPI with Pydantic for request/response validation
- **Async**: Every endpoint is async — no blocking I/O anywhere
- **Type Safety**: mypy strict mode across the entire codebase
- **Auto Docs**: OpenAPI spec generated automatically at `/docs`

Key endpoints:
```
POST /api/v1/tasks/extract      → Submit document for extraction
POST /api/v1/tasks/summarise    → Submit document for summarisation
POST /api/v1/tasks/assess-risk  → Submit document for risk assessment
GET  /api/v1/tasks/{id}         → Get task status and results
GET  /api/v1/tasks              → List tasks with filtering
GET  /api/v1/metrics            → Get performance metrics
POST /api/v1/evaluate           → Run evaluation suite
POST /api/v1/playground         → Ad-hoc LLM interaction
```

### 2. LLM Gateway

The core abstraction. All LLM interactions go through this layer.

**Why a gateway?**
- Swap models without changing task logic
- A/B test models on the same task
- Route different tasks to different models based on cost/performance
- Centralised token counting, rate limiting, and error handling

**Interface**:
```python
class LLMGateway(Protocol):
    async def complete(
        self,
        prompt: str,
        model: ModelConfig,
        output_schema: type[BaseModel] | None = None,
    ) -> LLMResponse: ...
```

Every provider (Anthropic, OpenAI, local) implements this protocol. LangChain handles the orchestration underneath.

### 3. Task Pipeline

Each task type (extraction, summarisation, risk assessment) follows the same pattern:

```
Document In → Pre-process → Prompt Construction → LLM Call → Parse → Validate → Result Out
```

- **Pre-process**: PDF parsing, text extraction, chunking
- **Prompt Construction**: Task-specific prompt templates with few-shot examples
- **LLM Call**: Via the gateway — model selection based on task config
- **Parse**: Structured output parsing into Pydantic models
- **Validate**: Schema validation, confidence scoring, field-level checks

### 4. Async Task Queue (SQS)

Document processing is not instant. A PDF extraction might take 10-30 seconds depending on document length and model.

**Flow**:
1. Client uploads document → API returns task ID immediately
2. Task message goes to SQS queue
3. Worker picks up task, processes via LLM gateway
4. Result stored, task status updated
5. Client polls or receives webhook notification

This decouples the upload from the processing, enabling:
- Horizontal scaling of workers
- Retry logic on failures
- Backpressure handling during spikes

### 5. Document Storage (S3)

Raw documents stored in S3 with:
- Versioning enabled
- Server-side encryption (AES-256)
- Lifecycle policies for cost management
- Pre-signed URLs for secure frontend uploads

### 6. Evaluation Framework

Every task type has an evaluation suite:

```
Evaluation Run
├── Dataset (labelled examples)
├── Task under test
├── Metrics collected:
│   ├── Accuracy (exact match on extracted fields)
│   ├── F1 Score (partial match scoring)
│   ├── Latency (p50, p95, p99)
│   ├── Token Usage (input + output)
│   └── Cost (calculated from token usage + model pricing)
└── Results stored for comparison
```

This enables:
- Model comparison (Claude vs GPT on the same dataset)
- Prompt iteration (measure improvement across prompt versions)
- Regression detection (catch performance drops before production)

### 7. Monitoring (CloudWatch)

Custom metrics pushed to CloudWatch:
- Task completion rate
- Latency per task type per model
- Error rate
- Token usage / cost
- Queue depth (SQS)

Alarms configured for:
- Error rate > 5%
- p95 latency > 30s
- Queue depth > 100 (backlog building)

## Data Flow: Document Extraction (End-to-End)

```
1. User uploads PDF via React dashboard
2. FastAPI receives file, uploads to S3, returns task_id
3. Extraction task message pushed to SQS
4. Worker consumes message:
   a. Downloads PDF from S3
   b. Parses PDF → text (PyPDF2 / pdfplumber)
   c. Constructs extraction prompt with schema
   d. Calls LLM Gateway → Claude (default for extraction)
   e. Parses structured JSON response
   f. Validates against Pydantic schema
   g. Stores result with confidence scores
5. Task status updated to "complete"
6. React dashboard polls task_id, displays results
```

## Security

See [security.md](security.md) for full security posture.

Key points:
- All secrets in environment variables, never in code
- AWS IAM with least-privilege policies
- S3 bucket policies restrict access to API service only
- VPS hardened (SSH key-only, firewall, fail2ban)
- HTTPS everywhere (Let's Encrypt via certbot)
- Input validation on all endpoints (Pydantic)
- Rate limiting on public endpoints

## Technology Decisions

See [ADRs](adrs/) for detailed reasoning behind key decisions.
