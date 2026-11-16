import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarise } from './health.js';

test('healthy only when database and signing key are both ok', () => {
  const ok = summarise({ database: 'ok', signingKey: 'ok' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.status, 'ok');
});

test('database down is unhealthy', () => {
  const res = summarise({ database: 'error', signingKey: 'ok' });
  assert.equal(res.status, 503);
  assert.equal(res.body.status, 'error');
  assert.equal(res.body.checks.database, 'error');
});

test('signing key unloadable is unhealthy (cannot sign = cannot serve)', () => {
  const res = summarise({ database: 'ok', signingKey: 'error' });
  assert.equal(res.status, 503);
});

test('version is included when known', () => {
  const res = summarise({ database: 'ok', signingKey: 'ok', version: '0.1.0' });
  assert.equal(res.body.version, '0.1.0');
});
