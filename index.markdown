---
layout: default
title: Rajat Gupta
description: Rajat Gupta, AVP Engineering at the Reserve Bank Innovation Hub (RBIH), leads platform, reliability, and security engineering for systems where downtime has a real cost.
permalink: /
profile_page: true
---

# Rajat Gupta
I lead platform, reliability, and security engineering for systems where downtime has a real cost. Today that means credit and fraud-prevention infrastructure for India's financial sector, as AVP Engineering at the Reserve Bank Innovation Hub (RBIH) in Bengaluru. Before that, I spent more than nine years in Berlin, where I grew from DevOps engineer to leading SRE, platform, and security teams for cloud gaming, music streaming, and payments at PlayStation, TIDAL, and Paymenttools.

<div class="pill-group">
  <span class="pill">Platform Engineering</span>
  <span class="pill">Site Reliability</span>
  <span class="pill">Security & Compliance</span>
  <span class="pill">Digital Public Infrastructure</span>
  <span class="pill">AI Adoption</span>
  <span class="pill">Technical Leadership</span>
</div>

<section class="card">
  <h2>Selected Work</h2>
  <ul>
    {% assign featured_projects = site.projects | where_exp: "project", "project.featured" | sort: "featured" %}
    {% for project in featured_projects %}
      <li>
        <strong><a href="{{ project.url | relative_url }}">{{ project.title }}</a></strong>: {{ project.impact }}
      </li>
    {% endfor %}
  </ul>
  <p><a href="{{ '/projects/' | relative_url }}">Browse all projects →</a></p>
</section>

<section class="card">
  <h2>What I Do</h2>
  <p>
    RBIH is a wholly owned subsidiary of the Reserve Bank of India. There I lead platform engineering, infrastructure, CI/CD, reliability, and AI adoption across the platforms RBIH builds for the financial sector, including the Unified Lending Interface (ULI), MuleHunter.AI, and the Digital Payments Intelligence Platform (DPIP). These systems serve lenders and banks, and through them their customers, so reliability, security, and regulatory compliance are part of the engineering work from day one.<br><br>

    The thread through all of my work is the same: make ownership clear, help teams decide with data, and build processes that reduce noise instead of adding more of it. I also enjoy green-field work that needs both technical judgment and steady leadership to get from idea to production.
  </p>
  <p><a href="{{ '/experience/' | relative_url }}">See the detailed experience timeline →</a></p>
</section>

<section class="card">
  <h2>Latest Writing</h2>
  <ul>
    {% for post in site.posts limit:3 %}
      <li>
        <strong><a href="{{ post.url | relative_url }}">{{ post.title }}</a></strong>
        <span> · {{ post.date | date: '%b %d, %Y' }}</span>
      </li>
    {% endfor %}
  </ul>
  <p><a href="{{ '/posts/' | relative_url }}">View the archive →</a></p>
</section>

<section class="card">
  <h2>Get In Touch</h2>
  <p>Email me at <a href="mailto:{{ site.email }}">{{ site.email }}</a> or reach out on <a href="https://www.linkedin.com/in/rajatguptarg/">LinkedIn</a> for speaking, writing, or mentoring opportunities.</p>

  <p>Read more about my blog posts on <a href="https://pulse.rajatgupta.work">Medium</a>.</p>
</section>
