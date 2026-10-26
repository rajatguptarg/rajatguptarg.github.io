# Newsletter sign-up Worker

A Cloudflare Worker that takes email addresses from the subscribe form on rajatgupta.work and adds them to a Resend segment after the reader confirms (double opt-in). New posts are then emailed to that segment by `.github/workflows/newsletter.yml`.

The site is static, so this Worker exists to keep the Resend API key off the page. It has no database: confirmation links are signed with a secret and expire after 48 hours.

## How a sign-up works

1. The reader enters an email address in the form. The form posts to `POST /subscribe`.
2. The Worker checks the address, the page origin, a hidden honeypot field and a rate limit, then sends a confirmation email through Resend.
3. The reader clicks the link in the email. `GET /confirm` shows a page with a **Confirm subscription** button. Opening the link alone changes nothing, because company mail scanners open links in incoming email.
4. The button posts to `POST /confirm`. The Worker creates the contact in the segment, or, if the reader unsubscribed before, re-subscribes them. Then it sends them to `/subscribe/confirmed/` on the site.

Without JavaScript the form still works: the Worker answers with a redirect to `/subscribe/check-email/` or `/subscribe/error/` instead of JSON.

## Settings

| Name | Where | What |
| --- | --- | --- |
| `RESEND_API_KEY` | Secret | A Resend API key with **Full access**. Contacts can only be managed with full access. Create a separate key for this Worker so you can revoke it on its own. |
| `TOKEN_SECRET` | Secret | A random string of at least 32 characters, for signing confirmation links. Changing it invalidates links already sent. |
| `RESEND_SEGMENT_ID` | `wrangler.toml` | The segment new posts are sent to. |
| `FROM_ADDRESS` | `wrangler.toml` | Sender of the confirmation email, on a domain verified in Resend. |
| `REPLY_TO` | `wrangler.toml` | Optional reply-to address. |
| `SITE_URL`, `SITE_NAME` | `wrangler.toml` | Used for redirects, links and the email text. |
| `ALLOWED_ORIGINS` | `wrangler.toml` | Comma-separated origins that may post the form. Requests from anywhere else get 403. |
| `SUBSCRIBE_LIMITER` | `wrangler.toml` | Rate limit: 10 attempts a minute per IP and per address. |

## Deploy

You need a Cloudflare account (the free plan is enough) and a domain verified in Resend.

1. In Resend, create a segment for blog subscribers and copy its ID into `RESEND_SEGMENT_ID` in `wrangler.toml`.
2. Install and log in:

   ```bash
   cd workers/newsletter
   npm ci
   npx wrangler login
   ```

3. Add the secrets:

   ```bash
   npx wrangler secret put RESEND_API_KEY
   openssl rand -base64 48 | npx wrangler secret put TOKEN_SECRET
   ```

4. Deploy and note the URL it prints (for example `https://rajatgupta-newsletter.<your-subdomain>.workers.dev`):

   ```bash
   npx wrangler deploy
   ```

5. Put that URL in `newsletter.endpoint` in the site's `_config.yml` and push. The subscribe form appears once the endpoint is set.

Optional: if `rajatgupta.work` is on Cloudflare DNS, add a custom domain such as `newsletter.rajatgupta.work` to the Worker (Workers & Pages > the Worker > Settings > Domains & Routes) and use that as the endpoint. Readers then see your domain in the confirmation link instead of `workers.dev`.

## Develop and test

```bash
npm test                     # unit tests, Resend replaced by a fake
npx wrangler dev             # local Worker on http://localhost:8787
```

For `wrangler dev`, put local values in `workers/newsletter/.dev.vars` (ignored by Git), for example:

```text
RESEND_API_KEY=re_...
TOKEN_SECRET=any-local-value-of-32-characters-or-more
RESEND_SEGMENT_ID=...
ALLOWED_ORIGINS=http://localhost:4000
```

Then set `newsletter.endpoint: "http://localhost:8787"` in a local, uncommitted copy of `_config.yml` and run `bundle exec jekyll serve`. With a real key, the confirmation emails really are sent.

## Logs

`npx wrangler tail` streams the Worker's logs. Failed Resend calls are logged with the status code and Resend's error message as Resend returned it. The Worker's own log lines do not include email addresses.
