import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';

// Pages render on the Node server so middleware can gate /app and /admin at request time.
// This service is the licence authority: it signs tokens and hands out release URLs, so every
// secret below is server-only and never reaches the browser.
export default defineConfig({
  site: 'https://portal.clu.gr',
  output: 'server',
  adapter: node({ mode: 'standalone', bodySizeLimit: 64 * 1024 }),
  security: {
    // Requests may arrive through nginx, which sets X-Forwarded-For to $remote_addr (never append).
    // Without that, clientAddress is 127.0.0.1 and per-IP rate limits collapse to one bucket.
    allowedDomains: [
      { hostname: 'portal.clu.gr', protocol: 'https' },
    ],
  },
  // Secrets are declared optional so a build never needs production credentials; a missing one is a
  // runtime condition, reported as unhealthy by /api/health rather than as a broken deploy.
  env: {
    schema: {
      // Database. `clu-app` sets this when deploy/app.conf says POSTGRES=yes.
      DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Portal sessions. Separate from clu.gr's admin secret on purpose.
      SESSION_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Licence keys are stored as HMAC-SHA-256(key, pepper). Rotate with KEY_PEPPER_OLD (dual-read).
      KEY_PEPPER: envField.string({ context: 'server', access: 'secret', optional: true }),
      KEY_PEPPER_OLD: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Ed25519 signing key for licence tokens and the revocation document, as PEM.
      // MVP only: move to KMS before public launch (ADR-0004 / REL-02).
      LICENCE_SIGNING_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      LICENCE_SIGNING_KID: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Signs short-lived artifact download URLs.
      DOWNLOAD_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Absolute path to the release store. Never relative: it must survive a deploy.
      ARTIFACT_DIR: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Merchant-of-Record webhook signature key.
      MOR_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),

      SMTP_HOST: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PORT: envField.number({ context: 'server', access: 'secret', default: 587 }),
      SMTP_USER: envField.string({ context: 'server', access: 'secret', optional: true }),
      SMTP_PASS: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO: envField.string({ context: 'server', access: 'secret', default: 'info@clu.gr' }),

      ADMIN_PASSWORD: envField.string({ context: 'server', access: 'secret', optional: true }),
      ADMIN_TOTP_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),

      // Unlocks detailed /api/health output (Authorization: Bearer <token> or ?token=).
      HEALTH_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
