import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

// Applies migrations/*.sql in filename order, each in its own transaction, and records what ran.
// Runs during clu-app's BUILD step, before the new release is health-checked: a release must never
// pass a health check against a schema it does not understand.
//
//   DATABASE_URL=postgres://… node scripts/migrate.mjs

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(here, '..', 'migrations');

if (!process.env.DATABASE_URL) {
  console.error('migrate: DATABASE_URL is not set');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query(`create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`);

  const applied = new Set((await client.query('select name from schema_migrations')).rows.map((r) => r.name));
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(dir, file), 'utf8');
    process.stdout.write(`applying ${file} … `);

    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log('ok');
    } catch (err) {
      await client.query('rollback');
      console.log('FAILED');
      throw err;
    }
  }

  const remaining = files.length - applied.size;
  console.log(remaining > 0 ? `migrated ${remaining} file(s)` : 'already up to date');
} finally {
  await client.end();
}
