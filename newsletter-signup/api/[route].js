// Vercel Function for /subscribe, /confirm and /health (vercel.json rewrites them to /api/<route>).
// The logic is in lib/handler.js.
import { handle, DEFAULTS } from '../lib/handler.js';

export default {
  fetch(request) {
    return handle(request, { ...DEFAULTS, ...process.env });
  },
};
