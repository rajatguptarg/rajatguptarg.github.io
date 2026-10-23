---
layout: default
title: Rajat Gupta
description: Rajat Gupta, AVP Engineering at the Reserve Bank Innovation Hub (RBIH), leads platform, reliability, and security engineering for systems where downtime has a real cost.
permalink: /
profile_page: true
---

<section class="hero" aria-labelledby="hero-name">
  <h1 id="hero-name">Rajat Gupta</h1>
  <p class="hero-role">AVP Engineering, Reserve Bank Innovation Hub · Bengaluru</p>
  <p class="hero-intro">I lead platform, reliability, and security engineering for systems where downtime has a real cost. Today that means credit and fraud-prevention infrastructure for India’s financial sector, as AVP Engineering at the Reserve Bank Innovation Hub (RBIH) in Bengaluru. Before that, I spent more than nine years in Berlin, where I grew from DevOps engineer to leading SRE, platform, and security teams for cloud gaming, music streaming, and payments at PlayStation, TIDAL, and Paymenttools.</p>
  <ul class="topics" aria-label="Focus areas">
    <li>Platform engineering</li>
    <li>Site reliability</li>
    <li>Security and compliance</li>
    <li>Digital public infrastructure</li>
    <li>AI adoption</li>
    <li>Technical leadership</li>
  </ul>
  <p class="actions">
    <a href="{{ '/posts/' | relative_url }}">Read my writing</a>
    <a href="{{ '/cv/' | relative_url }}">Get the CV</a>
    <a href="mailto:{{ site.email }}">Email me</a>
  </p>
</section>

<section class="section" aria-labelledby="selected-work">
  <h2 id="selected-work">Selected work</h2>
  <ol class="entry-list">
    {% assign featured_projects = site.projects | where_exp: "project", "project.featured" | sort: "featured" %}
    {% for project in featured_projects %}
      <li class="entry">
        <p class="entry-meta">{{ project.role }} · {{ project.timeline }}</p>
        <h3 class="entry-title"><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h3>
        <p class="entry-summary">{{ project.impact }}</p>
      </li>
    {% endfor %}
  </ol>
  <p class="section-more"><a href="{{ '/projects/' | relative_url }}">All case studies →</a></p>
</section>

<section class="section" aria-labelledby="what-i-do">
  <h2 id="what-i-do">What I do</h2>
  <p>RBIH is a wholly owned subsidiary of the Reserve Bank of India. There I lead platform engineering, infrastructure, CI/CD, reliability, and AI adoption across the platforms RBIH builds for the financial sector, including the Unified Lending Interface (ULI), MuleHunter.AI, and the Digital Payments Intelligence Platform (DPIP). These systems serve lenders and banks, and through them their customers, so reliability, security, and regulatory compliance are part of the engineering work from day one.</p>
  <p>The thread through all of my work is the same: make ownership clear, help teams decide with data, and build processes that reduce noise instead of adding more of it. I also enjoy green-field work that needs both technical judgment and steady leadership to get from idea to production.</p>
  <p class="section-more"><a href="{{ '/experience/' | relative_url }}">See the detailed experience timeline →</a></p>
</section>

<section class="section" aria-labelledby="latest-writing">
  <h2 id="latest-writing">Latest writing</h2>
  <ol class="entry-list">
    {% for post in site.posts limit:3 %}
      <li class="entry">
        <p class="entry-meta"><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%-d %B %Y' }}</time> · {% include reading-time.html content=post.content %}</p>
        <h3 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        {% if post.description %}<p class="entry-summary">{{ post.description }}</p>{% endif %}
      </li>
    {% endfor %}
  </ol>
  <p class="section-more"><a href="{{ '/posts/' | relative_url }}">All writing →</a></p>
</section>

<section class="section" aria-labelledby="get-in-touch">
  <h2 id="get-in-touch">Get in touch</h2>
  <p>Email me at <a href="mailto:{{ site.email }}">{{ site.email }}</a> or reach out on <a href="https://www.linkedin.com/in/rajatguptarg/">LinkedIn</a> for speaking, writing, or mentoring opportunities. I also publish on <a href="https://pulse.rajatgupta.work">Medium</a>.</p>
</section>
