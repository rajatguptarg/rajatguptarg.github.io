// Newsletter sign-up for rajatgupta.work, running on Cloudflare Workers.
//
//   POST /subscribe  The site's form. Sends a confirmation email (double opt-in).
//   GET  /confirm    The link in that email. Shows a Confirm button, because corporate
//                    link scanners open links but do not press buttons.
//   POST /confirm    The button. Adds the reader to the Resend segment and sends them
//                    back to the site.
//
// The Resend API key stays here and never reaches the browser. Confirmation links are
// signed with TOKEN_SECRET and expire, so the Worker needs no database.
// Configuration and deployment: workers/newsletter/README.md.

const TOKEN_TTL_HOURS = 48;
const MAX_BODY_BYTES = 10_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_SETTINGS = ['RESEND_API_KEY', 'RESEND_SEGMENT_ID', 'TOKEN_SECRET', 'FROM_ADDRESS', 'SITE_URL'];

export default {
  async fetch(request, env) {
    // Tolerates an endpoint configured with a trailing slash ("//subscribe") or a trailing slash on the path.
    const pathname = new URL(request.url).pathname.replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1');
    const missing = REQUIRED_SETTINGS.filter((name) => !env[name]);
    if (missing.length) {
      console.error(`Missing settings: ${missing.join(', ')}`);
      return new Response('Newsletter sign-up is not configured.', { status: 500 });
    }

    try {
      if (pathname === '/subscribe') {
        if (request.method === 'OPTIONS') return preflight(request, env);
        if (request.method === 'POST') return await subscribe(request, env);
      }
      if (pathname === '/confirm') {
        if (request.method === 'GET') return await confirmPage(request, env);
        if (request.method === 'POST') return await confirm(request, env);
      }
      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error(error);
      if (pathname === '/subscribe' && wantsJson(request)) {
        return json({ ok: false, error: 'server_error' }, 502, corsHeaders(request, env));
      }
      return redirect(sitePage(env, 'error'));
    }
  },
};

// ---------- Sign-up ----------

async function subscribe(request, env) {
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin, env)) return new Response('Forbidden', { status: 403 });

  const asJson = wantsJson(request);
  const cors = corsHeaders(request, env);
  const reply = (ok, error, status) =>
    asJson
      ? json(ok ? { ok: true } : { ok: false, error }, status, cors)
      : redirect(sitePage(env, ok ? 'check-email' : 'error'));

  const fields = await readFields(request);
  // Bots fill every field; people never see this one. Pretend it worked so bots learn nothing.
  if (fields.website) return reply(true, null, 200);

  const email = normalizeEmail(fields.email);
  if (!email) return reply(false, 'invalid_email', 400);

  if (env.SUBSCRIBE_LIMITER) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    for (const key of [`ip:${ip}`, `email:${email}`]) {
      const { success } = await env.SUBSCRIBE_LIMITER.limit({ key });
      if (!success) return reply(false, 'rate_limited', 429);
    }
  }

  await sendConfirmation(email, new URL(request.url).origin, env);
  return reply(true, null, 200);
}

async function sendConfirmation(email, workerOrigin, env) {
  const now = Date.now();
  const token = await createToken(email, env.TOKEN_SECRET, now);
  const link = `${workerOrigin}/confirm?token=${encodeURIComponent(token)}`;
  const siteName = env.SITE_NAME || new URL(env.SITE_URL).host;
  const host = new URL(env.SITE_URL).host;

  const response = await resend(env, 'POST', '/emails', {
    from: env.FROM_ADDRESS,
    to: [email],
    ...(env.REPLY_TO ? { reply_to: env.REPLY_TO } : {}),
    subject: `Confirm your subscription to ${siteName}`,
    html: confirmationHtml({ link, host, siteName }),
    text: confirmationText({ link, host, siteName }),
  }, {
    // The token expiry is rounded to the hour, so repeat sign-ups for the same address
    // within an hour send an identical request and Resend delivers only one email.
    'Idempotency-Key': `confirm/${Math.floor(now / 3_600_000)}/${await sha256Hex(email)}`,
  });

  // 409 means the same request is already sent or in flight.
  if (!response.ok && response.status !== 409) {
    throw new Error(`Resend refused the confirmation email: ${response.status} ${await response.text()}`);
  }
}

// ---------- Confirmation ----------

async function confirmPage(request, env) {
  const token = new URL(request.url).searchParams.get('token') || '';
  const email = await readToken(token, env.TOKEN_SECRET);
  if (!email) return redirect(sitePage(env, 'error'));

  const siteOrigin = new URL(env.SITE_URL).origin;
  return new Response(confirmPageHtml({ token, email, env }), {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      // form-action covers the redirect back to the site after the button is pressed.
      'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; font-src ${siteOrigin}; form-action 'self' ${siteOrigin}; frame-ancestors 'none'; base-uri 'none'`,
    },
  });
}

async function confirm(request, env) {
  const fields = await readFields(request);
  const email = await readToken(fields.token, env.TOKEN_SECRET);
  if (!email) return redirect(sitePage(env, 'error'));

  await addToSegment(email, env);
  return redirect(sitePage(env, 'confirmed'));
}

// Creates the contact, or re-subscribes an existing one (someone who unsubscribed and came
// back, or who is already a contact for another reason) and makes sure they are in the segment.
async function addToSegment(email, env) {
  const segment = env.RESEND_SEGMENT_ID;
  const address = encodeURIComponent(email);

  const existing = await resend(env, 'GET', `/contacts/${address}`);
  if (existing.status === 404) {
    await expectOk(resend(env, 'POST', '/contacts', { email, unsubscribed: false, segments: [{ id: segment }] }), 'create contact');
    return;
  }
  const contact = await (await expectOk(existing, 'look up contact')).json();

  if (contact.unsubscribed) {
    await expectOk(resend(env, 'PATCH', `/contacts/${contact.id}`, { unsubscribed: false }), 're-subscribe contact');
  }
  const segments = await (await expectOk(resend(env, 'GET', `/contacts/${contact.id}/segments`), 'list segments')).json();
  if (!segments.data?.some((s) => s.id === segment)) {
    await expectOk(resend(env, 'POST', `/contacts/${contact.id}/segments/${segment}`), 'add contact to segment');
  }
}

// ---------- Signed tokens ----------
// A token is base64url(JSON {e: email, x: expiry in seconds}) + "." + base64url(HMAC-SHA256).

export async function createToken(email, secret, now = Date.now()) {
  const hour = Math.floor(now / 3_600_000);
  const payload = base64url(new TextEncoder().encode(JSON.stringify({ e: email, x: (hour + 1 + TOKEN_TTL_HOURS) * 3600 })));
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(secret), new TextEncoder().encode(payload));
  return `${payload}.${base64url(new Uint8Array(signature))}`;
}

export async function readToken(token, secret, now = Date.now()) {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  try {
    // crypto.subtle.verify compares in constant time.
    const valid = await crypto.subtle.verify('HMAC', await hmacKey(secret), fromBase64url(signature), new TextEncoder().encode(payload));
    if (!valid) return null;
    const { e, x } = JSON.parse(new TextDecoder().decode(fromBase64url(payload)));
    if (typeof e !== 'string' || typeof x !== 'number' || x * 1000 < now) return null;
    return e;
  } catch {
    return null;
  }
}

function hmacKey(secret) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function base64url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64url(text) {
  const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Helpers ----------

export function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email.length <= 254 && EMAIL_PATTERN.test(email) ? email : null;
}

async function readFields(request) {
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY_BYTES) return {};
  const type = request.headers.get('Content-Type') || '';
  try {
    if (type.includes('application/json')) {
      const body = await request.json();
      return body && typeof body === 'object' ? stringFields(body) : {};
    }
    if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      return stringFields(Object.fromEntries(await request.formData()));
    }
  } catch {
    // An unreadable body is treated like an empty form.
  }
  return {};
}

function stringFields(object) {
  const fields = {};
  for (const name of ['email', 'website', 'token']) {
    if (typeof object[name] === 'string') fields[name] = object[name];
  }
  return fields;
}

function allowedOrigins(env) {
  return (env.ALLOWED_ORIGINS || new URL(env.SITE_URL).origin).split(',').map((o) => o.trim()).filter(Boolean);
}

function isAllowedOrigin(origin, env) {
  return Boolean(origin) && allowedOrigins(env).includes(origin);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  if (!isAllowedOrigin(origin, env)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function preflight(request, env) {
  return new Response(null, { status: 204, headers: corsHeaders(request, env) });
}

function wantsJson(request) {
  return (request.headers.get('Accept') || '').includes('application/json');
}

function json(body, status, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

function redirect(location) {
  return new Response(null, { status: 303, headers: { Location: location, 'Cache-Control': 'no-store' } });
}

function sitePage(env, name) {
  return `${env.SITE_URL.replace(/\/$/, '')}/subscribe/${name}/`;
}

function resend(env, method, path, body, headers = {}) {
  return fetch(`${env.RESEND_API_BASE || 'https://api.resend.com'}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Takes a Response or a promise of one.
async function expectOk(pending, action) {
  const response = await pending;
  if (!response.ok) throw new Error(`Resend failed to ${action}: ${response.status} ${await response.text()}`);
  return response;
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

// ---------- Email and page content ----------

function confirmationText({ link, host, siteName }) {
  return [
    'Hi,',
    '',
    `Someone, hopefully you, asked for new posts from ${host} to be sent to this address.`,
    '',
    'Confirm your subscription here:',
    link,
    '',
    `The link works for ${TOKEN_TTL_HOURS} hours. If you did not ask for this, ignore this email and nothing else will be sent.`,
    '',
    siteName,
  ].join('\n');
}

function confirmationHtml({ link, host, siteName }) {
  const safeLink = escapeHtml(link);
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Confirm your subscription</title></head>
<body style="margin:0;padding:0;background:#fbfaf7;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbfaf7;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;line-height:1.6;color:#1b1a17;">
<tr><td style="padding-bottom:16px;">Hi,</td></tr>
<tr><td style="padding-bottom:24px;">Someone, hopefully you, asked for new posts from ${escapeHtml(host)} to be sent to this address.</td></tr>
<tr><td style="padding-bottom:24px;"><a href="${safeLink}" style="display:inline-block;background:#b23a1c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:6px;">Confirm subscription</a></td></tr>
<tr><td style="padding-bottom:24px;color:#54504a;font-size:15px;">The link works for ${TOKEN_TTL_HOURS} hours. If you did not ask for this, ignore this email and nothing else will be sent.</td></tr>
<tr><td style="color:#54504a;font-size:15px;">${escapeHtml(siteName)}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function confirmPageHtml({ token, email, env }) {
  const site = env.SITE_URL.replace(/\/$/, '');
  const host = new URL(site).host;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Confirm your subscription · ${escapeHtml(env.SITE_NAME || host)}</title>
<style>
  @font-face { font-family: 'Figtree'; src: url('${site}/assets/fonts/figtree/figtree-latin-wght-normal.woff2') format('woff2'); font-weight: 300 900; font-display: swap; }
  @font-face { font-family: 'Perfectly Nineties'; src: url('${site}/assets/fonts/perfectly-nineties/perfectly-nineties-semibold.woff2') format('woff2'); font-weight: 600; font-display: swap; }
  :root { color-scheme: light dark; --bg: #fbfaf7; --text: #1b1a17; --muted: #54504a; --accent: #b23a1c; --on-accent: #ffffff; }
  @media (prefers-color-scheme: dark) { :root { --bg: #141311; --text: #ece8e0; --muted: #b9b3a8; --accent: #f2835f; --on-accent: #141311; } }
  body { margin: 0; background: var(--bg); color: var(--text); font: 1.125rem/1.6 'Figtree', system-ui, sans-serif; }
  main { max-width: 34rem; margin: 0 auto; padding: 4rem 1rem; }
  h1 { font-family: 'Perfectly Nineties', Georgia, serif; font-weight: 600; font-size: 2.25rem; line-height: 1.15; margin: 0 0 1rem; }
  p { margin: 0 0 1.5rem; }
  .muted { color: var(--muted); font-size: 1rem; }
  button { font: inherit; font-weight: 600; color: var(--on-accent); background: var(--accent); border: 0; border-radius: 6px; padding: 0.7rem 1.4rem; cursor: pointer; }
  button:focus-visible, a:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
  a { color: inherit; }
</style>
</head>
<body>
<main>
  <h1>Confirm your subscription</h1>
  <p>New posts from ${escapeHtml(host)} will be sent to <strong>${escapeHtml(email)}</strong>.</p>
  <form method="post" action="/confirm">
    <input type="hidden" name="token" value="${escapeHtml(token)}">
    <p><button type="submit">Confirm subscription</button></p>
  </form>
  <p class="muted">Changed your mind? Close this page and nothing happens. <a href="${escapeHtml(site)}/">Back to ${escapeHtml(host)}</a></p>
</main>
</body>
</html>`;
}
