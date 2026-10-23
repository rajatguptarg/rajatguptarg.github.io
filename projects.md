---
layout: page
title: Projects
description: Case studies from Rajat Gupta's work at RBIH, Paymenttools, TIDAL and PlayStation, with the role he played and the result.
intro: Case studies from RBIH, Paymenttools, TIDAL and PlayStation, with the role I played and the result.
permalink: /projects/
---

<ol class="entry-list">
  {% assign projects = site.projects | sort: 'timeline' | reverse %}
  {% for project in projects %}
    <li class="entry">
      <p class="entry-meta">{{ project.role }} · {{ project.timeline }}</p>
      <h2 class="entry-title"><a href="{{ project.url | relative_url }}">{{ project.title }}</a></h2>
      <p class="entry-summary">{{ project.summary | default: project.impact }}</p>
    </li>
  {% endfor %}
</ol>
