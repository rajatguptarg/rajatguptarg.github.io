---
layout: default
title: Rajat Gupta — Engineering Leader
description: Portfolio homepage for Rajat Gupta, covering SRE, security, and platform leadership.
permalink: /
---

# Rajat Gupta
Engineering Manager focused on platform reliability, security, and developer productivity for high-scale teams.

<div class="pill-group">
  <span class="pill">Site Reliability</span>
  <span class="pill">Security Engineering</span>
  <span class="pill">Platform</span>
  <span class="pill">Developer Experience</span>
  <span class="pill">Technical Leadership</span>
</div>

<section class="card">
  <h2>What I Do</h2>
  <p>I help engineering organizations ship resilient systems by pairing SRE practices with secure-by-default platforms. I love mentoring teams, rolling out clear SLOs, and translating complex technical work into business impact.</p>
  <p><a href="{{ '/experience/' | relative_url }}">See the detailed experience timeline →</a></p>
</section>

<section class="card">
  <h2>Featured Work</h2>
  <ul>
    {% for project in site.projects | slice: 0, 3 %}
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
  <p>Email me at <a href="mailto:{{ site.email }}">{{ site.email }}</a> or reach out on <a href="https://www.linkedin.com/in/rajatguptarg/">LinkedIn</a> for consulting and speaking opportunities.</p>
</section>
