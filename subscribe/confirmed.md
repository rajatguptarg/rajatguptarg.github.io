---
layout: page
title: You are subscribed
description: Your email subscription is confirmed.
intro: Thanks. You will get an email when the next post is published.
permalink: /subscribe/confirmed/
sitemap: false
noindex: true
---

Every email has an unsubscribe link if you change your mind.

While you wait, here are the latest posts:

<ol class="entry-list">
  {% for post in site.posts limit: 3 %}
    <li class="entry">
      <p class="entry-meta"><time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: '%-d %B %Y' }}</time> · {% include reading-time.html content=post.content %}</p>
      <h2 class="entry-title"><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
      <p class="entry-summary">{{ post.description | default: post.excerpt | strip_html | truncate: 200 }}</p>
    </li>
  {% endfor %}
</ol>
