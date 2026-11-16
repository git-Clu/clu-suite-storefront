# CluSuite Storefront

The licensing and distribution service for CluSuite: licence keys, seats, signed entitlement tokens,
revocation, release downloads, customer accounts, and (last) commerce through a Merchant of Record.

**It is not a WordPress plugin**, and it never runs on a customer site. It holds the key that signs
entitlement; customer sites only verify.

- Design: [`../CluSuite/STOREFRONT-PLAN.md`](../CluSuite/STOREFRONT-PLAN.md)
- Agent brief: [`../CluSuite/KICKOFF-storefront.md`](../CluSuite/KICKOFF-storefront.md)
- Contract: [`../CluSuite/clu-suite-license-protocol/CONTRACT.md`](../CluSuite/clu-suite-license-protocol/CONTRACT.md)

## Stack

Deliberately the same shape as the `Clu.gr/clu` app, so one set of conventions and one deploy path
cover both: **Astro 7 SSR, plain JavaScript, `node --test`, PostgreSQL with hand-written SQL**.

Where it differs, it differs on purpose:

| | `Clu.gr/clu` | here |
|---|---|---|
| Storage | JSON files, single process | PostgreSQL — seat limits need a transaction |
| Sessions | stateless HMAC cookie (one operator) | stateful, revocable rows (customers) |
| Signing | admin-session HMAC | Ed25519 licence tokens |

## Layout

```
astro.config.mjs      env schema: every secret is server-only
migrations/           numbered SQL, forward-only, applied by scripts/migrate.mjs
scripts/migrate.mjs   runs during deploy BUILD, before the release goes live
src/lib/              one module per concern, each with a colocated .test.js
src/middleware.js     request-time gate for /app
src/pages/api/health.js  200/503; red when the DB is down *or* the signing key will not load
deploy/app.conf       clu-app manifest (POSTGRES=yes, BUILD migrates)
```

## Local development

```bash
cp .env.example .env      # fill DATABASE_URL, SESSION_SECRET, KEY_PEPPER, LICENCE_SIGNING_KEY, …
npm ci
npm run migrate
npm test
npm run dev               # http://localhost:4321
```

Without SMTP, mail is logged to the console instead of sent.

## Status

- **S1 (this commit):** skeleton, health, migrations for accounts/users/sessions, deploy config.
- **S2:** keys, licences, Ed25519 tokens, `/api/v1/activate|refresh|deactivate`.
- **S3:** revocation, entitlements, signed download URLs.
- **S4:** accounts, MFA, staff panel.
- **S5:** Merchant-of-Record commerce.

Nothing on this service is in the request path of a customer's shop. A storefront request must never
depend on it (ADR-0006).
