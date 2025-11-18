---
layout: default
title: Posts
description: Writing and blog posts from Rajat Gupta.
permalink: /posts/
---

# Posts

{% if site.posts.size == 0 %}
<p>No posts yet. Stay tuned!</p>
{% endif %}

{% for post in site.posts %}
  <div class="card">
    <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
    <p class="pill">{{ post.date | date: '%b %d, %Y' }}</p>
    {% if post.excerpt %}
      <p>{{ post.excerpt | strip_html | truncate: 160 }}</p>
    {% endif %}
    <p><a href="{{ post.url | relative_url }}">Read the post →</a></p>
  </div>
{% endfor %}
