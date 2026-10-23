---
layout: page
title: Writing
description: Long-form writing by Rajat Gupta on site reliability, platform engineering, cloud security and engineering leadership.
intro: Long-form notes on site reliability, platform engineering, cloud security and engineering leadership.
permalink: /posts/
---

{% if site.posts.size == 0 %}
<p>No posts yet.</p>
{% endif %}

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in posts_by_year %}
<h2 class="archive-year">{{ year.name }}</h2>
<ol class="entry-list">
  {% for post in year.items %}
    <li class="entry">
      <p class="entry-meta"><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%-d %B %Y' }}</time> · {% include reading-time.html content=post.content %}</p>
      <h3 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      <p class="entry-summary">{{ post.description | default: post.excerpt | strip_html | truncate: 200 }}</p>
    </li>
  {% endfor %}
</ol>
{% endfor %}
