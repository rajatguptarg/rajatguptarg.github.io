---
layout: default
title: Projects
description: Portfolio projects from Rajat Gupta.
permalink: /projects/
---

# Projects

{% for project in site.projects %}
  <div class="card">
    <h3><a href="{{ project.url }}">{{ project.title }}</a></h3>
    <div class="pill-group">
      <span class="pill">{{ project.role }}</span>
    </div>
    <p>{{ project.summary | default: project.impact }}</p>
    <p><a href="{{ project.url }}">Read the full case study →</a></p>
  </div>
{% endfor %}
