# ADR-005: Comments Through giscus and Email Updates Through Resend

- Status: Accepted
- Date: 2026-10-26

## Context

The owner asked for two things on posts: a comment box, and a way for readers to subscribe so they get an email when a new post is published. The owner already uses Resend for email.

Constraints:

- The site is static and built by GitHub Pages. There is no server to hold an API key or receive a form, and plugins must be GitHub Pages compatible.
- Readers are senior engineering leaders, many on company email behind link scanners (ADR-003).
- The owner leads security work, so the design should not collect more than it needs, should prove consent, and should not leak keys.
- ADR-004 rules still apply: one column, no cards or pop-ups, WCAG 2.2 AA in light and dark.

Resend changed its contact model in late 2025: contacts are global, Audiences became Segments (the Audiences API is deprecated), and Topics hold reader-facing email preferences. Broadcasts are sent to a `segment_id`. Contacts and broadcasts need an API key with full access; the only other permission level can only send email.

## Decision

### Comments: giscus

Use [giscus](https://giscus.app), which stores comments in this repository's GitHub Discussions.

- Rejected Disqus (ads and tracking), utterances (uses Issues, which mixes comments with site work) and self-hosted systems such as Remark42 or Isso (a server to run and patch for a personal site).
- One discussion per post, found by the page path (`data-mapping="pathname"`) with strict matching, so `/posts/sre/` can never pick up the discussion for `/posts/sre-lessons/`.
- The giscus script loads only when the reader scrolls near the comments, so readers who stop earlier download nothing from giscus.
- `giscus.json` restricts which sites may load this repository's discussions to `rajatgupta.work` and localhost.
- The built-in `preferred_color_scheme` theme follows the reader's light or dark setting, like the site. A custom theme in the site's colours is possible later, but it could not be checked against the live widget when this was built.
- Nothing renders until `giscus.repo_id` and `giscus.category_id` are set in `_config.yml`. A post can set `comments: false`.

### Sign-up: a Vercel Function with double opt-in

The form posts to a small Vercel Function (`newsletter-signup`) that holds the Resend key.

- **Double opt-in.** The function emails a confirmation link; only after the reader confirms is the contact added to the segment. This proves consent, stops anyone signing up someone else, and keeps the list clean for deliverability.
- **A button, not just a link.** Opening the confirmation link shows a Confirm button; pressing it subscribes. Company mail scanners open links in incoming email but do not submit forms, so a scanner cannot confirm on the reader's behalf.
- **No database.** The link carries the address and an expiry, signed with HMAC-SHA256. The signing key is derived from the Resend API key (or `TOKEN_SECRET` if set), so there is only one secret to manage. Links expire after 48 hours.
- **Abuse limits.** Only listed origins may post the form; a hidden honeypot field catches simple bots; an in-memory limiter allows 10 attempts a minute per IP in each running instance; and the confirmation email uses a Resend idempotency key per address per hour, so one address gets at most one confirmation email an hour however often the form is sent. A Vercel Firewall rule can add a hard per-IP limit across instances.
- **Works without JavaScript.** With JavaScript the form shows the result in place. Without it the function redirects to `/subscribe/check-email/` or `/subscribe/error/`.
- **Returning readers.** If the address is already a contact (for example, someone who unsubscribed), the function sets it back to subscribed and adds it to the segment.
- **Vercel**, because the owner already has a Vercel account, so there is no new provider to sign up for. A Cloudflare Worker was built first (it has a built-in rate limiter); the owner chose Vercel instead. The handler only uses standard web APIs (`fetch`, Web Crypto), so it can move to another platform with a small entry file.
- Non-secret settings (site URL, sender, allowed origins) live in the code; only `RESEND_API_KEY` and `RESEND_SEGMENT_ID` are set in Vercel. `/health` reports whether they are present without revealing them.
- The form renders only when `newsletter.endpoint` is set in `_config.yml`.

### New-post emails: a GitHub Actions workflow

`.github/workflows/newsletter.yml` runs `.github/scripts/newsletter.rb` on every push to `gh-pages`, once a day as a backstop, and on demand.

- The script loads the site with Jekyll itself, so URLs, drafts and future-dated posts follow the same rules as the live build. No second parser of front matter or permalinks.
- **What gets sent:** posts dated within the last 7 days, without `newsletter: false` in their front matter, that are live on the site and have not been sent before.
- **Sent once.** Each broadcast is named `Post: <path>`. Before sending, the script lists existing broadcasts and skips a post whose path, or any old path in its `redirect_from`, already has a broadcast that is not a draft. Runs are serialised with a concurrency group so two runs cannot race.
- **Only after it is live.** After a push the script waits up to 15 minutes for GitHub Pages to publish the post, so readers never get a link to a 404. A post that is still not live is left for the next run.
- **Safety cap.** If more than 2 posts qualify at once (for example, after a mass edit of dates), the run stops without sending anything.
- **No double sends on retry.** Rate-limit responses are retried; server errors on the send call are not, because the broadcast may already have gone out. A re-run is safe because of the name check.
- **The email** is a teaser, not the full post: title, summary, first paragraph and a link, with Resend's unsubscribe link. Images, code blocks and diagrams render poorly in mail apps, and the comments are on the site.
- **Preview and test modes.** A manual run can save the email as an artifact, or send it only to one address, before anything reaches subscribers.

## Consequences

Benefits:

- Readers can comment and subscribe with no server to maintain and no ads or analytics scripts added to pages.
- Consent is provable, the key never reaches the browser, and a link scanner or a stranger cannot subscribe someone.
- Publishing stays the same: merge a post into `gh-pages` and the email follows once it is live.
- The sign-up function and the email script have tests that run in the `Site checks` workflow.

Trade-offs:

- Commenting needs a GitHub account. That suits most readers of an engineering site, but some leaders will not have one; they can still reply by email.
- The comment box loads a script from giscus.app. It is open source and loads only near the comments, but it is a third party on the page.
- Two services to look after: the Vercel project and the Resend account, plus two full-access Resend keys (one for the function, one for GitHub Actions). Use separate keys so either can be revoked alone, and rotate them if one leaks. A leaked key exposes the contact list.
- A post backdated by more than 7 days is not sent automatically; send it with a manual run. A post renamed after sending is recognised only if its old URL is in `redirect_from`, which the README already requires.
- Comments and the form stay hidden until the owner completes the set-up steps in the README.
