# ADR 003: Built-in Evaluation Framework

## Status
Accepted

## Date
2026-04-10

## Context

LLM outputs are non-deterministic. The same prompt with the same model can produce different results across runs. Without evaluation, we have no way to:
- Know if a prompt change improved or degraded performance
- Compare models objectively
- Catch regressions before they reach production
- Justify model/prompt decisions with data

Most LLM projects skip evaluation entirely and rely on "vibes" — manual spot-checking of outputs. This doesn't scale and provides no confidence for production deployment.

## Decision

Build evaluation as a first-class feature, not an afterthought. Every task type must have:

1. **A labelled dataset** — input documents with expected outputs (ground truth)
2. **An evaluation runner** — executes the task against every example in the dataset
3. **Metrics collection** — accuracy, F1, latency, token usage, cost
4. **Result storage** — persisted for comparison across runs
5. **Comparison tooling** — diff results between prompt versions, models, or configurations

The evaluation framework is accessible via API (`POST /api/v1/evaluate`) and visible in the dashboard.

## Consequences

### Positive
- **Data-driven decisions** — choose models and prompts based on metrics, not intuition
- **Regression detection** — run evals in CI to catch performance drops before deployment
- **Model comparison** — objective benchmarks for Claude vs GPT vs others on each task
- **Cost optimisation** — measure cost-per-task across models and find the best quality/cost ratio
- **Confidence** — quantifiable evidence that the system works

### Negative
- **Requires labelled data** — need to create and maintain ground truth datasets
- **Time investment** — building the framework takes time away from feature development
- **Eval runs cost money** — running every example through an LLM for every eval has token costs

### Risks
- Labelled datasets may not represent production data distribution
- Metrics may not capture all dimensions of output quality (e.g., readability, relevance)

## Metrics Specification

| Metric | Description | Task Types |
|---|---|---|
| Accuracy | Exact match on extracted fields | Extraction |
| F1 Score | Partial match scoring (precision + recall) | Extraction, Risk Assessment |
| Latency (p50, p95, p99) | End-to-end task duration | All |
| Token Usage | Input + output tokens per task | All |
| Cost | Calculated from tokens × model pricing | All |
| Hallucination Rate | Fields present in output but not in source | Extraction |
