---
layout: project
title: "Platform Automation & Observability at PlayStation"
role: Site Reliability Engineer · PlayStation (Sony Interactive Entertainment)
impact: Automated provisioning across 20+ data centers and built an observability stack ingesting 300+ GB/day of metrics for 100K+ servers.
timeline: 2020 – 2022
summary: Led the Platform Automation and Observability teams powering PSNow, shrinking toil and surfacing actionable telemetry.
---

## Mission
PSNow's cloud gaming service relied on globally distributed hardware with tight availability targets. Scaling both automation and telemetry was essential to keep up with subscriber demand.

## My Role
As the Site Reliability Engineer leading both Platform Automation and Observability, I managed the team backlogs, coordinated with hardware ops, and acted as the glue between data-center technicians and the central SRE program. I set the automation priorities, reviewed designs, and personally paired with engineers on the observability pipelines that supported PSNow.

## Contributions
- Directed the Platform Automation team to script hardware bring-up, reducing time-to-production for new racks from days to hours.
- Created tooling that validated firmware, network configs, and security baselines before automatically enrolling servers into capacity pools.
- Ran the Observability team ingesting 300+ GB of metrics per day while standardising Prometheus/Grafana deployments and alerting contracts.
- Built self-service APIs so service owners could provision dashboards, alerts, and synthetic tests without platform intervention.

## Business Value
- Operational toil dropped by 40%, freeing engineers to focus on higher-leverage improvements.
- Observability coverage expanded to every data center, giving central SRE instant visibility and faster incident response.
- Automation paved the way for future hybrid-cloud expansions because provisioning workflows were fully codified.

## Technologies & Tools
**Automation & Configuration:** Ansible, Terraform, Packer

**Observability Stack:** Prometheus, Grafana, AlertManager, ELK (Elasticsearch, Logstash, Kibana)

**Infrastructure:** Docker, Kubernetes

**Development:** Python, Go

**Cloud & Infrastructure:** AWS, Hybrid Infrastructure (20+ global data centers)

**Security:** Vault
