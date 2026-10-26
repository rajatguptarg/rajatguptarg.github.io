// Tests for the newsletter sign-up handler. Resend is replaced by a fake fetch, so no network is used.
// Run with: npm test (from newsletter-signup)
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { handle, createToken, readToken, normalizeEmail, signingSecret, DEFAULTS } from '../lib/handler.js';
import { createRateLimiter } from '../lib/rate-limit.js';

const WORKER = 'https://newsletter.example.vercel.app';
const SITE = 'https://rajatgupta.work';
const SECRET = 'test-secret-that-is-long-enough-for-hmac';

const env = () => ({
  ...DEFAULTS,
  RESEND_API_KEY: 're_test',
  RESEND_SEGMENT_ID: 'seg_1',
  ALLOWED_ORIGINS: `${SITE},http://localhost:4000`,
});
const secret = () => signingSecret(env());

// Fake Resend API. Each test sets `routes`; every call is recorded in `calls`.
let calls;
let routes;
beforeEach(() => {
  calls = [];
  routes = {};
  globalThis.fetch = async (url, init = {}) => {
    const path = new URL(url).pathname;
    const call = { method: init.method || 'GET', path, headers: init.headers || {}, body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    const handler = routes[`${call.method} ${path}`];
    if (!handler) return new Response('{"message":"not found"}', { status: 404 });
    const [status, body] = handler(call);
    return new Response(JSON.stringify(body ?? {}), { status });
  };
});

function subscribeRequest(fields, { origin = SITE, json = true, ip = '203.0.113.7' } = {}) {
  return new Request(`${WORKER}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(json ? { Accept: 'application/json' } : {}),
      ...(origin ? { Origin: origin } : {}),
      'x-real-ip': ip,
    },
    body: new URLSearchParams(fields),
  });
}

function confirmPost(token) {
  return new Request(`${WORKER}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  });
}

test('normalizes and validates email addresses', () => {
  assert.equal(normalizeEmail('  Reader@Example.COM '), 'reader@example.com');
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(normalizeEmail('a@b'), null);
  assert.equal(normalizeEmail(`${'a'.repeat(250)}@example.com`), null);
  assert.equal(normalizeEmail(undefined), null);
});

test('tokens round-trip, expire and reject tampering', async () => {
  const now = Date.UTC(2026, 9, 26, 10, 30);
  const token = await createToken('reader@example.com', SECRET, now);
  assert.equal(await readToken(token, SECRET, now), 'reader@example.com');
  assert.equal(await readToken(token, SECRET, now + 47 * 3_600_000), 'reader@example.com');
  assert.equal(await readToken(token, SECRET, now + 50 * 3_600_000), null, 'expired');
  assert.equal(await readToken(token, 'another-secret-another-secret-123', now), null, 'wrong secret');

  const [payload, signature] = token.split('.');
  const forged = Buffer.from(JSON.stringify({ e: 'attacker@example.com', x: 9e9 })).toString('base64url');
  assert.equal(await readToken(`${forged}.${signature}`, SECRET, now), null, 'payload swapped');
  assert.equal(await readToken(`${payload}.${signature}x`, SECRET, now), null, 'signature changed');
  assert.equal(await readToken('garbage', SECRET, now), null);
  assert.equal(await readToken(undefined, SECRET, now), null);
});

test('tokens for the same address in the same hour are identical', async () => {
  const hour = Date.UTC(2026, 9, 26, 10);
  assert.equal(await createToken('a@example.com', SECRET, hour + 60_000), await createToken('a@example.com', SECRET, hour + 3_000_000));
});

test('subscribe sends a confirmation email with a signed link', async () => {
  routes['POST /emails'] = () => [200, { id: 'email_1' }];
  const response = await handle(subscribeRequest({ email: ' Reader@Example.com ' }), env());

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), SITE);

  assert.equal(calls.length, 1);
  const [{ body, headers }] = calls;
  assert.deepEqual(body.to, ['reader@example.com']);
  assert.equal(body.from, 'Rajat Gupta <newsletter@rajatgupta.work>');
  assert.match(body.subject, /Confirm your subscription to Rajat Gupta/);
  assert.match(headers['Idempotency-Key'], /^confirm\/\d+\/[0-9a-f]{64}$/);
  assert.equal(headers.Authorization, 'Bearer re_test');

  const link = body.text.match(/https:\/\/\S+/)[0];
  assert.ok(link.startsWith(`${WORKER}/confirm?token=`));
  const token = new URL(link).searchParams.get('token');
  assert.equal(await readToken(token, await secret()), 'reader@example.com');
  assert.ok(body.html.includes('Confirm subscription'));
});

test('subscribe without JavaScript redirects to the check-email page', async () => {
  routes['POST /emails'] = () => [200, { id: 'email_1' }];
  const response = await handle(subscribeRequest({ email: 'reader@example.com' }, { json: false }), env());
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), `${SITE}/subscribe/check-email/`);
});

test('subscribe rejects an invalid address without calling Resend', async () => {
  const response = await handle(subscribeRequest({ email: 'nope' }), env());
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: 'invalid_email' });
  assert.equal(calls.length, 0);

  const noJs = await handle(subscribeRequest({ email: 'nope' }, { json: false }), env());
  assert.equal(noJs.headers.get('Location'), `${SITE}/subscribe/error/`);
});

test('subscribe refuses other origins and requests without an Origin header', async () => {
  for (const origin of ['https://evil.example', null]) {
    const response = await handle(subscribeRequest({ email: 'reader@example.com' }, { origin }), env());
    assert.equal(response.status, 403);
  }
  assert.equal(calls.length, 0);
});

test('a filled honeypot looks like success but sends nothing', async () => {
  const response = await handle(subscribeRequest({ email: 'bot@example.com', website: 'http://spam.example' }), env());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(calls.length, 0);
});

test('the rate limiter blocks sign-ups from an IP when it says no', async () => {
  const keys = [];
  const limited = { ...env(), SUBSCRIBE_LIMITER: (key) => (keys.push(key), false) };
  const response = await handle(subscribeRequest({ email: 'reader@example.com' }), limited);
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { ok: false, error: 'rate_limited' });
  assert.deepEqual(keys, ['203.0.113.7']);
  assert.equal(calls.length, 0);
});

test('the in-memory limiter allows 10 a minute per key', () => {
  const allow = createRateLimiter({ requests: 10, windowMs: 60_000 });
  const start = 1_000_000;
  for (let i = 0; i < 10; i++) assert.equal(allow('a', start + i), true);
  assert.equal(allow('a', start + 10), false, 'the 11th in the same minute is refused');
  assert.equal(allow('b', start + 10), true, 'other addresses are unaffected');
  assert.equal(allow('a', start + 60_001), true, 'allowed again once the oldest hit is a minute old');
});

test('the in-memory limiter keeps its memory bounded', () => {
  const allow = createRateLimiter({ requests: 1, windowMs: 60_000, maxKeys: 3 });
  for (const key of ['a', 'b', 'c']) allow(key, 0);
  assert.equal(allow('a', 1), false);
  allow('d', 2);
  assert.equal(allow('a', 3), true, 'counts restart after the table fills');
});

test('a Resend failure on sign-up returns a server error', async () => {
  routes['POST /emails'] = () => [500, { message: 'down' }];
  const response = await handle(subscribeRequest({ email: 'reader@example.com' }), env());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { ok: false, error: 'server_error' });
});

test('CORS preflight answers allowed origins only', async () => {
  const preflight = (origin) =>
    handle(new Request(`${WORKER}/subscribe`, { method: 'OPTIONS', headers: { Origin: origin } }), env());
  assert.equal((await preflight('http://localhost:4000')).headers.get('Access-Control-Allow-Origin'), 'http://localhost:4000');
  assert.equal((await preflight('https://evil.example')).headers.get('Access-Control-Allow-Origin'), null);
});

test('the confirmation link shows a button and does not subscribe on its own', async () => {
  const token = await createToken('reader@example.com', await secret());
  const response = await handle(new Request(`${WORKER}/confirm?token=${encodeURIComponent(token)}`), env());
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<form method="post" action="\/confirm">/);
  assert.ok(html.includes('reader@example.com'));
  assert.match(response.headers.get('Content-Security-Policy'), /form-action 'self' https:\/\/rajatgupta\.work/);
  assert.equal(calls.length, 0, 'opening the link must not change anything');
});

test('a bad or expired confirmation link goes to the error page', async () => {
  const expired = await createToken('reader@example.com', await secret(), Date.now() - 72 * 3_600_000);
  for (const token of ['bad', expired]) {
    const page = await handle(new Request(`${WORKER}/confirm?token=${encodeURIComponent(token)}`), env());
    assert.equal(page.headers.get('Location'), `${SITE}/subscribe/error/`);
    const post = await handle(confirmPost(token), env());
    assert.equal(post.headers.get('Location'), `${SITE}/subscribe/error/`);
  }
  assert.equal(calls.length, 0);
});

test('confirming a new reader creates the contact in the segment', async () => {
  routes['POST /contacts'] = () => [200, { object: 'contact', id: 'c_1' }];
  const token = await createToken('reader@example.com', await secret());
  const response = await handle(confirmPost(token), env());

  assert.equal(response.status, 303);
  assert.equal(response.headers.get('Location'), `${SITE}/subscribe/confirmed/`);
  assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), ['GET /contacts/reader%40example.com', 'POST /contacts']);
  assert.deepEqual(calls[1].body, { email: 'reader@example.com', unsubscribed: false, segments: [{ id: 'seg_1' }] });
});

test('confirming a reader who unsubscribed earlier re-subscribes them and adds the segment', async () => {
  routes['GET /contacts/reader%40example.com'] = () => [200, { id: 'c_1', email: 'reader@example.com', unsubscribed: true }];
  routes['PATCH /contacts/c_1'] = () => [200, { id: 'c_1' }];
  routes['GET /contacts/c_1/segments'] = () => [200, { object: 'list', data: [{ id: 'seg_other' }], has_more: false }];
  routes['POST /contacts/c_1/segments/seg_1'] = () => [200, { id: 'seg_1' }];

  const response = await handle(confirmPost(await createToken('reader@example.com', await secret())), env());
  assert.equal(response.headers.get('Location'), `${SITE}/subscribe/confirmed/`);
  assert.deepEqual(calls.map((c) => `${c.method} ${c.path}`), [
    'GET /contacts/reader%40example.com',
    'PATCH /contacts/c_1',
    'GET /contacts/c_1/segments',
    'POST /contacts/c_1/segments/seg_1',
  ]);
  assert.deepEqual(calls[1].body, { unsubscribed: false });
});

test('confirming twice changes nothing the second time', async () => {
  routes['GET /contacts/reader%40example.com'] = () => [200, { id: 'c_1', unsubscribed: false }];
  routes['GET /contacts/c_1/segments'] = () => [200, { object: 'list', data: [{ id: 'seg_1' }], has_more: false }];

  const response = await handle(confirmPost(await createToken('reader@example.com', await secret())), env());
  assert.equal(response.headers.get('Location'), `${SITE}/subscribe/confirmed/`);
  assert.deepEqual(calls.map((c) => c.method), ['GET', 'GET']);
});

test('a Resend failure while confirming goes to the error page', async () => {
  routes['GET /contacts/reader%40example.com'] = () => [500, { message: 'down' }];
  const response = await handle(confirmPost(await createToken('reader@example.com', await secret())), env());
  assert.equal(response.headers.get('Location'), `${SITE}/subscribe/error/`);
});

test('missing settings fail closed', async () => {
  const response = await handle(subscribeRequest({ email: 'reader@example.com' }), { ...env(), RESEND_API_KEY: '' });
  assert.equal(response.status, 500);
  assert.equal(calls.length, 0);
});

test('an endpoint configured with a trailing slash still works', async () => {
  routes['POST /emails'] = () => [200, { id: 'email_1' }];
  const request = new Request(`${WORKER}//subscribe`, subscribeRequest({ email: 'reader@example.com' }));
  const response = await handle(request, env());
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
});

test('the signing key is derived from the API key unless TOKEN_SECRET is set', async () => {
  const a = await signingSecret({ RESEND_API_KEY: 're_one' });
  assert.equal(a, await signingSecret({ RESEND_API_KEY: 're_one' }));
  assert.notEqual(a, await signingSecret({ RESEND_API_KEY: 're_two' }));
  assert.notEqual(a, 're_one');
  assert.equal(await signingSecret({ RESEND_API_KEY: 're_one', TOKEN_SECRET: SECRET }), SECRET);
});

test('a link signed before the API key changed no longer works', async () => {
  const token = await createToken('reader@example.com', await signingSecret({ RESEND_API_KEY: 're_old' }));
  const response = await handle(confirmPost(token), env());
  assert.equal(response.headers.get('Location'), `${SITE}/subscribe/error/`);
});

test('the Vercel function path /api/subscribe works too', async () => {
  routes['POST /emails'] = () => [200, { id: 'email_1' }];
  const response = await handle(new Request(`${WORKER}/api/subscribe`, subscribeRequest({ email: 'reader@example.com' })), env());
  assert.equal(response.status, 200);
  const link = calls[0].body.text.match(/https:\/\/\S+/)[0];
  assert.ok(link.startsWith(`${WORKER}/confirm?token=`), 'the link uses the short /confirm path');
});

test('health reports missing settings without calling Resend', async () => {
  const response = await handle(new Request(`${WORKER}/api/health`), { ...DEFAULTS });
  assert.deepEqual(await response.json(), {
    ok: false,
    missing: ['RESEND_API_KEY', 'RESEND_SEGMENT_ID'],
    problem: 'Missing settings: RESEND_API_KEY, RESEND_SEGMENT_ID',
  });
  assert.equal(calls.length, 0);
});

// Each health test uses its own API key, because results are cached per key and segment.
test('health reads the segment to prove the key and segment work, and caches the answer', async () => {
  routes['GET /segments/seg_1'] = () => [200, { object: 'segment', id: 'seg_1', name: 'Blog' }];
  const settings = { ...env(), RESEND_API_KEY: 're_health_ok' };
  const first = await handle(new Request(`${WORKER}/health`), settings);
  assert.deepEqual(await first.json(), { ok: true, missing: [], problem: null });
  assert.equal(calls[0].headers.Authorization, 'Bearer re_health_ok');
  await handle(new Request(`${WORKER}/health`), settings);
  assert.equal(calls.length, 1, 'the second check within five minutes uses the cached answer');
});

test('health explains a send-only API key', async () => {
  routes['GET /segments/seg_1'] = () => [401, { statusCode: 401, name: 'restricted_api_key', message: 'This API key is restricted to only send emails' }];
  const response = await handle(new Request(`${WORKER}/health`), { ...env(), RESEND_API_KEY: 're_send_only' });
  const body = await response.json();
  assert.equal(body.ok, false);
  assert.match(body.problem, /can only send emails.*Full access/);
});

test('health explains a segment ID that does not exist', async () => {
  routes['GET /segments/seg_1'] = () => [404, { name: 'not_found' }];
  const body = await (await handle(new Request(`${WORKER}/health`), { ...env(), RESEND_API_KEY: 're_wrong_segment' })).json();
  assert.equal(body.ok, false);
  assert.match(body.problem, /RESEND_SEGMENT_ID does not match/);
});

test('sign-up and confirmation write log lines without the address', async () => {
  const lines = [];
  const original = console.log;
  console.log = (line) => lines.push(String(line));
  try {
    routes['POST /emails'] = () => [200, { id: 'email_1' }];
    routes['POST /contacts'] = () => [200, { id: 'c_1' }];
    await handle(subscribeRequest({ email: 'private@example.com' }), env());
    await handle(confirmPost(await createToken('private@example.com', await secret())), env());
  } finally {
    console.log = original;
  }
  assert.deepEqual(lines, ['Sent a confirmation email', 'Confirmed: added a new contact to the segment']);
});

test('unknown paths return 404', async () => {
  const response = await handle(new Request(`${WORKER}/admin`), env());
  assert.equal(response.status, 404);
});
