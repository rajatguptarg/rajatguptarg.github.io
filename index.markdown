---
layout: default
title: Rajat Gupta · AVP Engineering at RBIH
description: Portfolio homepage for Rajat Gupta, AVP Engineering at the Reserve Bank Innovation Hub, covering platform, SRE, security, and engineering leadership.
permalink: /
---

# Rajat Gupta
AVP Engineering at the Reserve Bank Innovation Hub (RBIH) in Bengaluru. I lead platform, infrastructure, reliability, and security engineering for digital public infrastructure in India's financial sector.

<div class="pill-group">
  <span class="pill">Platform Engineering</span>
  <span class="pill">Site Reliability</span>
  <span class="pill">Security & Compliance</span>
  <span class="pill">Digital Public Infrastructure</span>
  <span class="pill">AI Adoption</span>
  <span class="pill">Technical Leadership</span>
</div>

<section class="card">
  <h2>What I Do</h2>
  <p>
    I lead engineering teams that keep platforms reliable, secure, and ready to scale. Today that work happens at RBIH, a wholly owned subsidiary of the Reserve Bank of India. My remit covers platform engineering, infrastructure, CI/CD, reliability, and AI adoption across the platforms RBIH builds for the financial sector, including the Unified Lending Interface (ULI), MuleHunter.ai, and the Digital Payments Intelligence Platform (DPIP). These systems serve lenders, banks, and through them their customers, so reliability, security, and regulatory compliance are part of the engineering work from day one.<br><br>

    Before RBIH, I spent more than nine years in Berlin, first building and then leading SRE, platform, and security work at companies like PlayStation, TIDAL, and Paymenttools (REWE Digital). My work sits at the intersection of SRE, Security, and backend systems, where clarity and ownership matter as much as technical depth. I guide teams through complex problems, help them make decisions with data, and build processes that reduce noise instead of adding more of it.<br><br>

    I spend a lot of time shaping cross-functional work so that people know who owns what and why. When something critical needs to be delivered, I bring structure, alignment, and a clear path forward. I also enjoy driving green-field initiatives, especially the ones that need both technical judgment and steady leadership to get from idea to production.<br><br>

    Along the way, I write about the lessons I learn. My goal is to share practical insights with other engineers and leaders, not theory for its own sake. I like turning complicated systems into simple explanations that help others think more clearly.
  </p>
  <p><a href="{{ '/experience/' | relative_url }}">See the detailed experience timeline →</a></p>
</section>

<section class="card">
  <h2>Featured Work</h2>
  <ul>
    {% assign featured_projects = site.projects | sort: 'timeline' | reverse %}
    {% for project in featured_projects limit:3 %}
      <li>
        <strong><a href="{{ project.url }}">{{ project.title }}</a></strong> — {{ project.impact }}
      </li>
    {% endfor %}
  </ul>
  <p><a href="{{ '/projects/' | relative_url }}">Browse all projects →</a></p>
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
