// Best-effort sign-up limit per IP address, kept in memory. Vercel reuses a function instance for
// many requests, so this stops one address hammering the form, but separate instances keep separate
// counts. For a hard limit across instances, add the Vercel Firewall rule described in README.md.

export function createRateLimiter({ requests, windowMs, maxKeys = 10_000 }) {
  const recent = new Map();
  return function allow(key, now = Date.now()) {
    const hits = (recent.get(key) || []).filter((time) => now - time < windowMs);
    const allowed = hits.length < requests;
    if (allowed) hits.push(now);
    // Keeps memory bounded if many addresses appear; the limit simply restarts for everyone.
    if (!recent.has(key) && recent.size >= maxKeys) recent.clear();
    recent.set(key, hits);
    return allowed;
  };
}
