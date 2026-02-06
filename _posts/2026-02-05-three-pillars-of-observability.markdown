---
layout: post
title: "The Three Pillars of Observability: Logs, Metrics, Traces Done Right"
date: 2026-02-05 00:00:00 +0100
categories: observability sre devops platform
---

Monitoring tells you when something breaks. Observability tells you why, even when you did not know the failure mode existed. In modern microservice systems, that difference is the line between a fast fix and an all-hands war room.

This post breaks down the three pillars of observability - **logs, metrics, and traces** - and shows how to implement them in a way that actually helps during incidents.

## The Shift from "Known Unknowns" to "Unknown Unknowns"

Traditional monitoring is built around anticipated failures: disk full, CPU pegged, server down. These are known unknowns. Microservices introduce failure chains you have never seen before. Observability is what lets you debug those novel scenarios by slicing high-dimensional data without shipping new code or adding new instrumentation mid-incident.

## Metrics: More Than Just the Average

Metrics are the bedrock of alerting. They are cheap to store and fast to query, but they trade detail for speed. Use the right primitives and avoid misleading aggregates.

### Pick the Right Instrument

- **Counters** are monotonic values that only increase (example: `http_requests_total`). Never graph raw counters; use the rate of change.
- **Gauges** are point-in-time snapshots (memory usage, queue depth). If your scrape interval is too long, you will miss the spike that actually caused the failure.
- **Histograms** track distributions (latency, payload size). They enable server-side quantiles without storing every sample.

### The Fallacy of Averages

Averages lie. If 99 requests take 10ms and 1 request takes 10s, the average looks fine, but your p99 is 10,000ms. For user-facing SLIs, use p95, p99, and p99.9. That is what correlates with churn.

### The High Cardinality Trap

Time-series databases create a new series for every unique label set. Adding `user_id` or email as a label creates millions of series and can exhaust RAM. This is the fastest way to crash Prometheus.

**Solution:** For high-cardinality data, store it in columnar analytics databases like ClickHouse. They compress well, scan only relevant columns, and can handle millions of unique values without index explosions.

### The Four Golden Signals

To avoid dashboard fatigue, focus on the four signals that matter:

- **Latency**: Time to service a request. Separate success and failure.
- **Traffic**: Demand on the system. Requests per second, I/O rate.
- **Errors**: Failed request rate, explicit and implicit.
- **Saturation**: The most constrained resource (thread pool, memory). This is a leading indicator.

Alert on symptoms, not causes. Users do not care if CPU is at 100% if their request is fast. They do care if their request is slow even when CPU is at 10%.

## Logs: Structure or Suffer

Logs are immutable records of events. In distributed systems, raw text logs turn into noise. The fix is structured logging.

### The Non-Negotiable: Structured Logs

Unstructured logs are expensive to query and fragile to parse. Structured logs make analysis reliable and fast.

Unstructured:

```
2023-10-27 10:00:00 ERROR Payment failed for user bob due to timeout
```

Structured:

```json
{
  "timestamp": "2023-10-27T10:00:00Z",
  "level": "ERROR",
  "event": "payment_failed",
  "user": "bob",
  "reason": "timeout",
  "service": "payment-service",
  "request_id": "12345-abcde",
  "trace_id": "..."
}
```

With structured logs, you can run SQL-like queries and index specific fields. It forces teams to agree on log schemas and guarantees metadata like `trace_id` is always present.

### Canonical Log Lines (Stripe Pattern)

Instead of emitting 20 log lines per request, aggregate context in memory and emit a single, wide JSON log line when the request finishes. This reduces log volume 10x to 20x and makes debugging a single query.

### The Log-Trace Bridge

Every log line generated within a request should include `trace_id` and `span_id`. When you are in a trace view, you should be able to click a span and see the exact logs for that operation. This is one of the biggest MTTR reducers in practice.

## Traces: Sample Smarter, Not Harder

Distributed tracing builds a causal graph of requests across service boundaries. Metrics show that something is slow. Traces show why.

### The Data Model

- **Trace**: End-to-end workflow ("Purchase Item").
- **Span**: Named, timed operation ("SQL SELECT", "HTTP POST /cart").
- **Context**: Metadata that links spans across services.

### Sampling: The Economics of Tracing

Tracing every request is expensive. Sampling decides which traces to keep.

**Head-based sampling** (decide at the start):
- Pros: Easy, low overhead.
- Cons: Statistically blind. You will miss rare errors.

**Tail-based sampling** (decide at the end):
- Pros: Keep 100% of anomalous traces (errors, high latency).
- Cons: Requires a stateful collector and more memory.

OpenTelemetry Collector example:

```yaml
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 50000
    policies:
      - name: error-policy
        type: status_code
        status_code:
          status_codes: [ERROR]
      - name: latency-policy
        type: latency
        latency:
          threshold_ms: 500
      - name: probabilistic-policy
        type: probabilistic
        probabilistic:
          sampling_percentage: 1
```

### Context Propagation Across Languages

Consistent propagation ensures spans link across polyglot services. OpenTelemetry makes this possible across Python, Go, and more with standardized `traceparent` headers.

## OpenTelemetry: The Unification Layer

OpenTelemetry provides a vendor-neutral API and protocol for logs, metrics, and traces. You instrument once and export to any backend. If you switch vendors, you do not rewrite your application code.

Architecture:

- **OTel API/SDK**: Instrumentation in your app.
- **OTel Collector**: Vendor-agnostic proxy for sampling, batching, and exporting.
- **OTLP**: High-performance gRPC protocol for telemetry.

## The Fourth Pillar: Continuous Profiling

Logs, metrics, and traces often cannot pinpoint performance problems at the code level. Continuous profiling fills that gap.

Modern eBPF-based profilers sample production systems with very low overhead and produce flame graphs that reveal where CPU time is spent. This directly ties observability to FinOps by showing which hot paths drive cost.

## The ROI Conversation

Observability can consume 20% to 30% of infrastructure spend. To justify it, quantify outcomes:

- **MTTR Reduction**: Faster incident resolution saves revenue.
- **Developer Velocity**: Less time investigating means more feature work.
- **Infrastructure Optimization**: Profiling reduces compute waste.

## Build vs Buy

- **Buy** if the team is small and you want to focus on product.
- **Build** if scale makes SaaS costs massive and you can staff a dedicated observability team.
- **Hybrid**: Use OpenTelemetry for collection and a vendor backend to avoid lock-in.

## The Checklist: Observability Done Right

- All logs are structured JSON.
- Logs include `trace_id` and `span_id`.
- High-cardinality data stays out of TSDBs (or moves to columnar stores).
- Critical flows use tail-based sampling.
- OpenTelemetry is the standard for instrumentation and collection.
- Alerts are based on SLO burn rates, not static thresholds.
- Continuous profiling is enabled.
- Weekly ops reviews and monthly game days are standard practice.

Read the full post on Medium [here](https://pulse.rajatgupta.work/the-three-pillars-of-observability-logs-metrics-traces-done-right-114597ebdcf1).
