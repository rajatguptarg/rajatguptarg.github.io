---
layout: project
title: "Observability Governance & Internal Developer Portal"
role: Engineering Manager · TIDAL (Block Inc.)
impact: Cut log spend by 30% and total observability cost by 12% while making telemetry actionable inside the IDP.
timeline: 2023 – 2024
summary: Blended log governance, cost-per-service reporting, and IDP integrations so teams own their telemetry budgets and insights.
---

## Problem
Observability usage ballooned alongside TIDAL's subscriber growth, but budgets and accountability lagged. Teams lacked visibility into the cost of their telemetry choices, and runbooks lived outside their daily workflow.

## My Role
I directed the observability roadmap, stacked-ranked investments with product leadership, and paired with platform engineers who extended the IDP. I also set the policies for log governance, coached teams on cost reviews, and reported savings to finance.

## Solution
- Added "observability cost per service" to the IDP alongside SLOs, deployments, and ownership metadata.
- Implemented log-governance guardrails that enforce sampling policies, retention tiers, and alerting standards based on service tier.
- Built dashboards that correlate telemetry volume with customer and infrastructure signals, helping teams reason about trade-offs.
- Automated DORA metric collection and surfaced it in the same portal so engineering leaders could balance speed with reliability.

## Outcome
- Engineering teams became mindful of log volume and value, trimming redundant ingestion by 30% and lowering observability spend 12% without sacrificing coverage.
- Runbooks, telemetry, and cost data now co-exist, letting on-call engineers jump straight from an alert to remediation context.
- Product conversations reference the same metrics and budgets, improving prioritization of resilience work.
