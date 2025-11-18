---
layout: project
title: "Service Discovery Modernization with Consul"
role: Engineering Manager · TIDAL (Block Inc.)
impact: Enabled platform-agnostic discovery so ECS and EC2 services could evolve independently while remaining secure.
timeline: 2023 – 2024
summary: Replaced AWS App Mesh with Consul to future-proof discovery, harden service-to-service auth, and decouple migrations.
---

## Challenge
AWS deprecated App Mesh, yet TIDAL's fleet still spanned ECS workloads and latency-sensitive EC2 services. A forced migration timeline would have risked mission-critical streaming flows, regional launches, and modernisation milestones.

## My Role
I owned the technical strategy and execution for discovery modernisation, chairing the RFC process, securing security review sign-off, and coordinating the rollout plan across playback, catalog, and monetisation services. I also mentored engineers who built the Terraform modules and validated the migration playbooks.

## Approach
- Evaluated open-source options and led RFCs that compared multi-cloud readiness, operational burden, and security posture.
- Selected Consul for its first-class ECS and EC2 support, then designed the control-plane topology plus failover strategy.
- Built Terraform modules and Ansible playbooks so product teams could self-serve registration, mesh policies, and certificate rotation.
- Integrated Consul health checks with our IDP so ownership, runbooks, and alert routing stayed consistent with SRE processes.

## Impact
- Platform teams can retire EC2 workloads on their schedule without blocking new ECS features.
- mTLS policies between services now ship as defaults, raising the security baseline across the estate.
- Discovery data powers auto-generated topology views, giving engineers a clearer understanding of blast radius before deploying changes.
