import pg from 'pg';
import { DATABASE_URL } from 'astro:env/server';

// ponytail: one pool for the process. If this service ever runs on more than one host, sessions and
// seat accounting still work — they live in Postgres, not in memory (unlike clu.gr's JSON store).
const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export const query = (text, params) => pool.query(text, params);

// Runs fn inside a transaction. Use this for anything that must not half-happen:
// seat reservation, provisioning, revocation + version bump.
export async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const out = await fn(client);
    await client.query('commit');
    return out;
  } catch (err) {
    try { await client.query('rollback'); } catch { /* the connection may already be gone */ }
    throw err;
  } finally {
    client.release();
  }
}

// Health probe: proves the database answers right now.
export async function ping() {
  try {
    await pool.query('select 1');
    return 'ok';
  } catch {
    return 'error';
  }
}

export const close = () => pool.end();
