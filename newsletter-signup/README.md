# Newsletter sign-up function

A Vercel Function that takes email addresses from the subscribe form on rajatgupta.work and adds them to a Resend segment after the reader confirms (double opt-in). New posts are then emailed to that segment by `.github/workflows/newsletter.yml`.

The site is static, so this function exists to keep the Resend API key off the page. It has no database: confirmation links are signed and expire after 48 hours.

- Live at `https://rajatgupta-newsletter.vercel.app` (Vercel project `rajatgupta-newsletter`, team "rajatguptarg's projects").
- `https://rajatgupta-newsletter.vercel.app/health` says whether the settings below are present. It never shows their values.

## How a sign-up works

1. The reader enters an email address in the form. The form posts to `POST /subscribe`.
2. The function checks the address, the page origin, a hidden honeypot field and a per-IP rate limit, then sends a confirmation email through Resend.
3. The reader clicks the link in the email. `GET /confirm` shows a page with a **Confirm subscription** button. Opening the link alone changes nothing, because company mail scanners open links in incoming email.
4. The button posts to `POST /confirm`. The function creates the contact in the segment, or, if the reader unsubscribed before, re-subscribes them. Then it sends them to `/subscribe/confirmed/` on the site.

Without JavaScript the form still works: the function answers with a redirect to `/subscribe/check-email/` or `/subscribe/error/` instead of JSON.

## Files

| Path | What |
| --- | --- |
| `lib/handler.js` | All the logic, as a standard `handle(request, env)` web handler |
| `lib/rate-limit.js` | In-memory limit of 10 sign-up attempts a minute per IP |
| `api/[route].js` | The Vercel entry point; `vercel.json` rewrites `/subscribe`, `/confirm` and `/health` to it |
| `public/robots.txt` | The only static file served, so the source is never public |
| `test/` | Tests, with Resend replaced by a fake |

## Settings

Set these two in Vercel (**Project > Settings > Environment Variables**, environment **Production**), then redeploy:

| Name | What |
| --- | --- |
| `RESEND_API_KEY` | A Resend API key with **Full access**; contacts can only be managed with full access. Use a key just for this function so you can revoke it on its own. Mark it **Sensitive**. |
| `RESEND_SEGMENT_ID` | The ID of the Resend segment that new posts are sent to. |

Everything else has a default in `DEFAULTS` in `lib/handler.js`, and any of them can be overridden with an environment variable of the same name:

| Name | Default |
| --- | --- |
| `SITE_URL` | `https://rajatgupta.work` |
| `SITE_NAME` | `Rajat Gupta` |
| `ALLOWED_ORIGINS` | `https://rajatgupta.work` (comma-separated; other origins get 403) |
| `NEWSLETTER_FROM` | `Rajat Gupta <newsletter@rajatgupta.work>` (must be on a domain verified in Resend; the same name as the GitHub Actions variable) |
| `REPLY_TO` | `contact@rajatgupta.work` |
| `TOKEN_SECRET` | Not set. Confirmation links are then signed with a key derived from `RESEND_API_KEY`, so rotating the API key also invalidates links already sent. Set it only if you want link signing independent of the key. |

## Abuse limits

- Only `ALLOWED_ORIGINS` may post the form, and a hidden honeypot field catches simple bots.
- One address gets at most one confirmation email an hour, however often the form is sent (a Resend idempotency key).
- 10 sign-up attempts a minute per IP, counted in memory per running instance. For a hard limit across instances, add a rule in Vercel under **Project > Firewall > Configure > New Rule**: if Request Path equals `/subscribe` and Method equals `POST`, then Rate Limit, fixed window, 60 seconds, 10 requests, keyed by IP. (The firewall API refused to create it before the project's Firewall page had been opened, so it is not set up yet.)

## Deploy

The project was created and first deployed through the Vercel connector, from this folder on the `feat/wizardly-curie-x3eif3` branch. It is not connected to Git, so changes here do not deploy on their own. The project's **Root Directory** is set to `newsletter-signup`; without it, a dashboard **Redeploy** builds the whole website repository instead of this function. After changing an environment variable, use **Redeploy** on the latest production deployment. To deploy a code change:

```bash
cd newsletter-signup
npx vercel link --project rajatgupta-newsletter   # once
npx vercel deploy --prod
```

Or connect the repository in Vercel (**Project > Settings > Git**), set **Root Directory** to `newsletter-signup` and the production branch to `gh-pages`, and Vercel deploys on every merge that changes this folder.

## Develop and test

```bash
npm test          # unit tests, Resend replaced by a fake
npx vercel dev    # local function on http://localhost:3000
```

For `vercel dev`, `npx vercel env pull .env.local` copies the project's settings into a local file (ignored by Git). Add `ALLOWED_ORIGINS=http://localhost:4000` to it, set `newsletter.endpoint: "http://localhost:3000"` in a local, uncommitted copy of `_config.yml`, and run `bundle exec jekyll serve`. With a real key, the confirmation emails really are sent.

## Logs

Vercel shows the function's logs under **Project > Logs**. Failed Resend calls are logged with the status code and Resend's error message as Resend returned it. The function's own log lines do not include email addresses.
