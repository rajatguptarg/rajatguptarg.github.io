// Vercel Function for /subscribe, /confirm and /health (vercel.json rewrites them to /api/<route>).
// The logic is in lib/handler.js.
import { handle, DEFAULTS } from '../lib/handler.js';
import { createRateLimiter } from '../lib/rate-limit.js';

// At most 10 sign-up attempts a minute per IP address, per running instance.
const limiter = createRateLimiter({ requests: 10, windowMs: 60_000 });

export default {
  fetch(request) {
    return handle(request, { ...DEFAULTS, ...process.env, SUBSCRIBE_LIMITER: limiter });
  },
};
