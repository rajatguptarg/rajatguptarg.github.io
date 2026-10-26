---
layout: page
title: Subscribe
description: Get new posts from Rajat Gupta by email, on site reliability, platform engineering, cloud security and engineering leadership.
intro: Get new posts by email. One email when a post is published, and nothing else.
permalink: /subscribe/
---

{% assign subscribe_endpoint = site.newsletter.endpoint | strip %}
{% if subscribe_endpoint != "" %}
{% include subscribe.html id="page" heading=false %}

<h2>What to expect</h2>

- An email when a new post goes up, with its title, a short summary and a link to read it on this site.
- No other mail. Your address is stored with Resend, the email service, and used only for these emails.
- An unsubscribe link in every email. One click and you are off the list.

Prefer a feed reader? The same posts are in the <a href="{{ '/feed.xml' | relative_url }}">RSS feed</a>.
{% else %}
Email updates are not open yet. Until then, new posts are in the <a href="{{ '/feed.xml' | relative_url }}">RSS feed</a>.
{% endif %}
