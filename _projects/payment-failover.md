---
layout: project
title: Payment Failover and Resilience
role: Lead, SRE and Platform
impact: Reduced incident impact and MTTR, improved SLO compliance
timeline: 2023
summary: Re-architected payment routing to survive provider incidents and degradations.
---

## Context
Global payments had a single-processor dependency that caused cascading incidents. Regulatory changes required us to prove redundancy.

## Approach
- Designed a multi-provider architecture with automated failover playbooks.
- Introduced load-aware routing and circuit breakers instrumented via OpenTelemetry.
- Coordinated chaos experiments with product to validate guardrails.

## Outcome
We improved transaction success to 99.97%, slashed failover time from 20 minutes to 90 seconds, and eliminated weekend fire drills.
