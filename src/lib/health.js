// Pure health summary, kept separate from the route so it can be unit tested.
// A service that cannot reach its database OR cannot load its signing key is not healthy,
// even though it can still serve pages — hence both checks in one place.

/**
 * @param {{ database: string, signingKey: string, version?: string }} checks
 * @returns {{ status: number, body: Record<string, unknown> }}
 */
export function summarise(checks) {
  const healthy = checks.database === 'ok' && checks.signingKey === 'ok';
  return {
    status: healthy ? 200 : 503,
    body: {
      status: healthy ? 'ok' : 'error',
      time: new Date().toISOString(),
      checks,
      ...(checks.version ? { version: checks.version } : {}),
    },
  };
}
