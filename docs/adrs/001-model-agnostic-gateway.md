# ADR 001: Model-Agnostic LLM Gateway

## Status
Accepted

## Date
2026-04-10

## Context

RiskLens AI needs to call LLMs for multiple task types (extraction, summarisation, risk assessment). The LLM landscape is evolving rapidly — new models release frequently, pricing changes, and different models perform better on different tasks.

We could:
1. Call provider APIs directly from each task module
2. Use LangChain directly in each task module
3. Build a gateway abstraction that all tasks go through

## Decision

Build a model-agnostic LLM gateway as a central service layer. All LLM interactions go through a single interface, regardless of the underlying provider.

The gateway uses LangChain internally for provider adapters but exposes a clean Python protocol that task modules consume.

## Consequences

### Positive
- **Swap models without changing task code** — configure per-task, per-environment, or per-request
- **A/B testing** — run the same task against multiple models and compare results
- **Centralised concerns** — token counting, rate limiting, error handling, retry logic, cost tracking all live in one place
- **Evaluation** — easy to benchmark models against each other on the same dataset
- **Future-proof** — when a new model drops, add one adapter and every task can use it

### Negative
- **Additional abstraction layer** — adds complexity vs direct API calls
- **LangChain coupling** — gateway internals depend on LangChain, though this is hidden from consumers
- **Potential performance overhead** — extra layer between task and provider (minimal in practice)

### Risks
- LangChain is a fast-moving library — breaking changes between versions are possible
- Abstraction may not cover all provider-specific features (e.g., Claude's extended thinking)

## Alternatives Considered

**Direct API calls**: Simpler initially but leads to duplicated logic across tasks, makes model swapping painful, and scatters provider-specific code everywhere.

**LangChain directly in tasks**: Better than raw API calls but still couples task logic to LangChain specifics. Tasks shouldn't need to know about LangChain — they just need "send this prompt, get structured output back."
