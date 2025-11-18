---
layout: default
title: Projects
description: Portfolio projects from Rajat Gupta.
permalink: /projects/
---

# Projects

{% for project in site.projects %}
  <div class="card">
    <h2><a href="{{ project.url }}">{{ project.title }}</a></h2>
    <p class="pill">{{ project.role }}</p>
    <p>{{ project.summary | default: project.impact }}</p>
    <p><a href="{{ project.url }}">Read the full case study →</a></p>
  </div>
{% endfor %}
