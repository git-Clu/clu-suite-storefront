import crypto from 'node:crypto';
import { HEALTH_TOKEN, LICENCE_SIGNING_KEY } from 'astro:env/server';
import { ping } from '../../lib/db.js';
import { summarise } from '../../lib/health.js';

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest();
const tokenOk = (given) => Boolean(HEALTH_TOKEN) && crypto.timingSafeEqual(sha(given ?? ''), sha(HEALTH_TOKEN));

// Proves the key parses and really is an Ed25519 private key. A key that loads but is the wrong
// type would fail at the first token issue, long after the health check went green.
function signingKey() {
  try {
    const key = crypto.createPrivateKey(LICENCE_SIGNING_KEY);
    return key.asymmetricKeyType === 'ed25519' ? 'ok' : `wrong-type:${key.asymmetricKeyType}`;
  } catch {
    return 'error';
  }
}

// GET /api/health         → { status } for uptime monitors (200 healthy, 503 unhealthy)
// GET /api/health + token → the same plus per-check detail
export async function GET({ request, url }) {
  const given = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? url.searchParams.get('token');
  const detailed = tokenOk(given);

  const result = summarise({ database: await ping(), signingKey: signingKey() });

  return Response.json(detailed ? result.body : { status: result.body.status, time: result.body.time }, {
    status: result.status,
    headers: { 'cache-control': 'no-store' },
  });
}
