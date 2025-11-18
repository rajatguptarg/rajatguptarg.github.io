---
layout: project
title: "Edge Compute for Low-Latency Streaming"
role: Engineering Manager · TIDAL (Block Inc.)
impact: Delivered multi-CDN edge compute, yielding 8% uptime gains, 12% cost savings, and a 70% boost in user satisfaction.
timeline: 2022 – 2024
summary: Built edge infrastructure across Fastly, Cloudflare, and CloudFront to keep music streaming responsive worldwide.
---

## Background
TIDAL's growth demanded predictable performance in every region, yet our legacy stack tied us to a single CDN and left only coarse-grained failover levers.

## My Role
As Engineering Manager I owned the program charter, partnered with product leadership to define performance targets, and coordinated the multi-team squad that delivered routing software, Terraform modules, and observability hooks. I cleared blockers across network, SRE, and partner CDNs while mentoring lead engineers on architecture trade-offs.

## Execution
- Designed an edge compute architecture that abstracts Fastly, Cloudflare, and CloudFront behind a policy-driven routing layer.
- Collaborated with SRE, networking, and product teams to codify latency SLOs and observability requirements for each geography.
- Automated provisioning through Terraform and custom APIs so new services could publish cache rules, security headers, and routing intents via self-service workflows.
- Fed real-time analytics back into the observability stack, enabling automatic failover when jitter or saturation thresholds were breached.

## Results
- Streaming sessions now anchor to the closest healthy edge, improving perceived responsiveness and overall uptime.
- Multi-provider leverage cut CDN costs 12% while reducing dependency risk.
- Product teams can roll out features without waiting on manual CDN configuration, accelerating experimentation and reinforcing SRE best practices.

## Technologies & Tools

<div class="experience-tech">
  <div class="experience-tech-label">Technologies & Tools Used</div>
  <div class="experience-tech-list">
    <span class="tech-tag">Fastly</span>
    <span class="tech-tag">Cloudflare</span>
    <span class="tech-tag">CloudFront</span>
    <span class="tech-tag">Terraform</span>
    <span class="tech-tag">DataDog</span>
    <span class="tech-tag">Docker</span>
    <span class="tech-tag">AWS ECS</span>
    <span class="tech-tag">Python</span>
    <span class="tech-tag">Go</span>
    <span class="tech-tag">AWS Secret Manager</span>
    <span class="tech-tag">AWS</span>
  </div>
</div>
