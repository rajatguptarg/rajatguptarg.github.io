---
layout: default
title: Projects
description: Portfolio projects from Rajat Gupta.
permalink: /projects/
---

# Projects

{% assign projects = site.projects | sort: 'timeline' | reverse %}
{% for project in projects %}
  <div class="card">
    <h2><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h2>
    <div class="pill-group">
      <span class="pill">{{ project.role }}</span>
    </div>
    <p>{{ project.summary | default: project.impact }}</p>
    <p><a href="{{ project.url | relative_url }}">Read the full case study →</a></p>
  </div>
{% endfor %}
