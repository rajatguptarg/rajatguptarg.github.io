---
layout: project
title: "Runbook Runner: Turning Static Docs into Actionable Automation"
role: Engineering Manager · Paymenttools (REWE)
impact: Delivered an automated runbook execution system that reduced manual toil, improved operator confidence, and created a single reliable path for executing high risk operational tasks.
timeline: 2025-2026
summary: Designed and shipped a lightweight automation platform that transformed static operational documentation into guided, safe, and auditable workflows used across SRE, Security, and Product teams.
---

## Background
Teams at Paymenttools relied heavily on static Confluence pages and tribal knowledge for operational tasks. Everything from rotating credentials to draining nodes to recovering stuck Kafka consumers involved searching through long documents, interpreting partial instructions, and executing steps manually. This created unnecessary cognitive load, introduced risk during production operations, and made it hard to ensure consistency across shifts and teams.

On top of that, several workflows required coordination across SRE, Security, and Platform teams, but the execution path was rarely clear. Operators often had to ask around for the right steps or validate commands on the fly, which slowed response times and increased the likelihood of errors.

## My Role
I led the concept, design, and delivery of the Runbook Runner system. My responsibility covered shaping the functional requirements, defining guardrails for safe automation, establishing governance with Security and Compliance, and aligning product engineering on shared expectations for operational workflows. I worked closely with SREs, platform engineers, and domain teams to ensure the solution was practical, easy to adopt, and improved day to day operations.


## Execution
- Identified the highest toil, highest risk manual procedures across SRE, Security, and the platform groups by running interviews, reviewing historical incidents, and auditing Confluence runbooks.
- Designed the Runbook Runner architecture: a simple Backstage plugin backed by a lightweight service that maps YAML based runbooks into guided, step by step workflows.
- Introduced safety controls including required confirmations, contextual hints, environment scoping, and command dry runs to prevent accidental misuse.
- Created a governance model with Security, including change review for privileged steps, audit logging, and alignment with PCI and ISMS requirements.
- Built a migration guide and templates so teams could convert their existing Confluence runbooks into structured, parameterized versions compatible with the Runner.
- Partnered with Platform and TXP teams to embed the Runner into their operational flows, including onboarding new runbooks and refining existing ones during early adoption.
- Ran hands on training sessions for engineers and on call responders to ensure teams understood how to write, validate, and safely execute automated runbooks.


## Results
- Operators gained a single, reliable interface for executing operational tasks, reducing ambiguity and manual effort.
- High risk procedures became safer and more predictable through guardrails, validations, and auditability.
- Reduced on call cognitive load by shifting from open ended documentation to guided workflows with clear parameters and expected outcomes.
- Accelerated common platform operations such as rotating secrets, managing database replicas, and performing routine maintenance.
- Improved consistency across teams because automation replaced one off variations and outdated Confluence steps.

## Technologies & Tools

<div class="experience-tech">
  <div class="experience-tech-label">Technologies & Tools Used</div>
  <div class="experience-tech-list">
    <span class="tech-tag">Python</span>
    <span class="tech-tag">FastAPI</span>
    <span class="tech-tag">React</span>
    <span class="tech-tag">Docker</span>
    <span class="tech-tag">Kubernetes</span>
    <span class="tech-tag">GCP</span>
    <span class="tech-tag">Grafana</span>
    <span class="tech-tag">Incident.io</span>
  </div>
</div>
