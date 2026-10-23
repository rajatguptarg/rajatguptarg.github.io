---
layout: project
title: "Incident Management for Digital Public Infrastructure"
role: AVP Engineering · RBIH
impact: Designed RBIH's incident management practice so production alerts on the Unified Lending Interface (ULI) reach an accountable responder and every major incident ends with tracked follow-ups.
timeline: "2026"
featured: 3
summary: Built the incident management process, roles, and rollout plan for RBIH's platforms, starting with ULI, the credit infrastructure that connects lenders with data service providers.
---

## Background
The Unified Lending Interface (ULI) is a credit digital public infrastructure platform, conceptualised by the Reserve Bank of India and built by RBIH. Lenders use it to reach a large network of data service providers through standard APIs, for checks such as identity, income, land records, and credit history. When a platform like this degrades, the impact lands on lenders first and then on the borrowers waiting for a credit decision.

Good monitoring tells you that something is wrong. It does not make sure the right person is working on it, that everyone knows their role, or that the follow-ups get closed. This work covers everything after an alert fires.

## My Role
I own the incident management practice for RBIH Engineering. I wrote the process and lead the rollout together with the DevOps team. Along the way I work with the CTO and engineering leadership, the partner success team that talks to lenders, and the security and compliance team that handles regulatory reporting.

## Execution
- Defined what counts as an incident at RBIH, and what does not, so teams declare early instead of debating whether something is "big enough".
- Introduced a P0 to P2 severity model based on user impact, with a deadline for closing postmortem action items at each level.
- Set out four incident roles with clear boundaries: the Incident Commander (the on-call engineer, and the only person making production changes), the Incident Lead (coordinates, removes blockers, owns the timeline), the Communication Lead (stakeholder and partner updates), and the Incident Owner (runs the postmortem and drives follow-ups).
- Designed a two-phase workflow, detection and triage first, then response, resolution, and postmortem, with one incident channel and one bridge per incident.
- Wrote a communication plan that separates internal updates, leadership escalation, partner communication, and regulatory reporting, so each audience hears from one accountable owner.
- Set up time-bound escalation paths and on-call rotations for every role, and made postmortems mandatory for P0 and P1 incidents.
- Planned a phased rollout: ULI first, then RBIH's other platforms.

## Where It Stands
This work is still rolling out, so there are no final numbers yet.
- The process gives engineering, partner success, and leadership one definition of an incident, one severity scale, and one escalation path.
- Once the ULI rollout settles, the same practice extends to RBIH's other platforms.

## Practices

<div class="experience-tech">
  <div class="experience-tech-label">Practices Used</div>
  <div class="experience-tech-list">
    <span class="tech-tag">Incident Management</span>
    <span class="tech-tag">On-call</span>
    <span class="tech-tag">Severity Model</span>
    <span class="tech-tag">Escalation Paths</span>
    <span class="tech-tag">Postmortems</span>
    <span class="tech-tag">Runbooks</span>
    <span class="tech-tag">SRE</span>
    <span class="tech-tag">Stakeholder Communication</span>
  </div>
</div>
