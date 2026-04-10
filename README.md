# RiskLens AI

> AI-powered document processing platform for commercial insurance risk digitisation.

A model-agnostic LLM service layer that provides a unified interface for insurance document processing tasks — extraction, risk assessment, and summarisation — with built-in evaluation, monitoring, and multi-model support.

## Why This Exists

Commercial insurance still relies heavily on manual document review. Underwriters spend hours reading submissions, extracting key data points, and assessing risk — work that is repetitive, error-prone, and slow.

RiskLens AI automates this by providing an LLM-powered service layer that can:

- **Extract structured data** from unstructured insurance documents (PDFs, submissions, policy wordings)
- **Assess risk** by analysing extracted data against configurable risk criteria
- **Summarise documents** into concise, actionable briefs for underwriters
- **Evaluate performance** with built-in metrics (accuracy, F1, latency, cost-per-task)

The platform is **model-agnostic** — swap between Claude, GPT, or any other foundation model without changing a single line of consuming code.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Dashboard                      │
│          (Upload / Playground / Metrics)                  │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API
┌──────────────────────▼──────────────────────────────────┐
│                   FastAPI Service                         │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Extraction  │  │ Summarisation│  │ Risk Assessment│  │
│  │    Task      │  │    Task      │  │     Task       │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘  │
│         │                │                   │           │
│  ┌──────▼────────────────▼───────────────────▼────────┐  │
│  │            LLM Gateway (Model-Agnostic)            │  │
│  │         Claude │ GPT │ Local │ Any Provider        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Evaluation  │  │  Monitoring  │  │   Task Queue   │  │
│  │  Framework   │  │  (CloudWatch)│  │    (SQS)       │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      [AWS S3]    [AWS SQS]   [CloudWatch]
      Doc Store   Task Queue   Metrics
```

See [docs/architecture.md](docs/architecture.md) for detailed system design and data flow diagrams.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.12, FastAPI, asyncio, Pydantic, mypy (strict) |
| **LLM Orchestration** | LangChain, multiple provider support (Anthropic, OpenAI) |
| **AI Capabilities** | RAG, prompt engineering, agentic workflows, document processing |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, Tanstack Query |
| **Testing** | pytest (backend), Vitest + React Testing Library (frontend) |
| **Cloud** | AWS S3, SQS, CloudWatch, IAM |
| **Infrastructure** | Hostinger VPS, nginx, SSL, GitHub Actions CI/CD |
| **Evaluation** | Custom framework — accuracy, F1, latency, cost-per-task metrics |

## Project Structure

```
risklens-ai/
├── client/                     # React 19 + TypeScript frontend
│   └── src/
│       ├── features/
│       │   ├── upload/         # Document upload & extraction results
│       │   ├── playground/     # Task playground with model selection
│       │   └── dashboard/      # Metrics, task history, charts
│       ├── services/           # Typed API client layer
│       └── shared/             # UI primitives, layouts
│
├── server/                     # FastAPI + Python backend
│   ├── features/
│   │   ├── gateway/            # Model-agnostic LLM interface
│   │   ├── extraction/         # Document field extraction
│   │   ├── summarisation/      # Document summarisation
│   │   ├── risk_assessment/    # Risk scoring pipeline
│   │   └── evaluation/         # Eval framework & metrics
│   ├── infrastructure/
│   │   ├── llm/                # LangChain provider adapters
│   │   ├── storage/            # S3 integration
│   │   ├── queue/              # SQS async processing
│   │   └── monitoring/         # CloudWatch metrics
│   └── main.py
│
├── docs/                       # System design & decisions
│   ├── architecture.md         # Detailed architecture overview
│   ├── security.md             # Security posture & hardening
│   └── adrs/                   # Architecture Decision Records
│
└── infra/                      # Infrastructure as Code
```

## Key Features

### Model-Agnostic Gateway
A unified LLM interface that abstracts away provider-specific APIs. Configure model selection per-task, per-environment, or per-request. Switch between Claude, GPT, or local models without downstream changes.

### Async Task Pipeline
All LLM operations are fully asynchronous using Python's asyncio. Document processing tasks are queued via SQS and processed concurrently, enabling high throughput without blocking.

### Evaluation Framework
Every task type has associated evaluation metrics. Run evaluation suites against labelled datasets to measure accuracy, F1 score, latency, and cost. Compare performance across models to make data-driven decisions about which model to use where.

### Document Processing
Upload insurance documents (PDFs, scanned images) and extract structured data — policyholder details, coverage amounts, risk factors, effective dates — returned as validated JSON with confidence scores.

## Getting Started

```bash
# Clone
git clone https://github.com/lloydrivers50/risklens-ai.git
cd risklens-ai

# Backend
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # Add your API keys
uvicorn main:app --reload

# Frontend
cd client
npm install
npm run dev
```

## Architecture Decision Records

| ADR | Decision | Status |
|---|---|---|
| [001](docs/adrs/001-model-agnostic-gateway.md) | Model-agnostic LLM gateway over direct API calls | Accepted |
| [002](docs/adrs/002-async-task-pipeline.md) | Async task pipeline with SQS | Accepted |
| [003](docs/adrs/003-evaluation-framework.md) | Built-in evaluation framework | Accepted |

## Status

🚧 **In active development** — see commit history for real-time progress.

## License

MIT
