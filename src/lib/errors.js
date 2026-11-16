// Stable error codes. Clients switch on these, never on message text (CONTRACT.md §5).
// The CLU_* family is owned by clu-suite-core; LICENCE_* belongs here.
// Any code added here must also be registered in
// clu-suite-license-protocol/registry/error-codes.json — the contract gate fails otherwise.

export const CODES = {
  // Request shape
  BAD_REQUEST: 'LICENCE_BAD_REQUEST',
  RATE_LIMITED: 'LICENCE_RATE_LIMITED',

  // Key and licence state
  INVALID_KEY: 'LICENCE_INVALID_KEY',
  NOT_FOUND: 'LICENCE_NOT_FOUND',
  EXPIRED: 'LICENCE_EXPIRED',
  REVOKED: 'LICENCE_REVOKED',
  SEAT_LIMIT: 'LICENCE_SEAT_LIMIT',
  FEATURE_NOT_GRANTED: 'LICENCE_FEATURE',
  DOMAIN_MISMATCH: 'LICENCE_DOMAIN_MISMATCH',

  // Downloads
  DOWNLOAD_EXPIRED: 'LICENCE_DOWNLOAD_EXPIRED',
  DOWNLOAD_SIGNATURE: 'LICENCE_DOWNLOAD_SIGNATURE',

  // Commerce
  WEBHOOK_SIGNATURE: 'LICENCE_WEBHOOK_SIGNATURE',
  WEBHOOK_REPLAY: 'LICENCE_WEBHOOK_REPLAY',
  WEBHOOK_AMOUNT: 'LICENCE_WEBHOOK_AMOUNT',

  // Service
  CONFIG: 'LICENCE_CONFIG',
  INTERNAL: 'LICENCE_INTERNAL',
};

// Messages are deliberately generic: anything that could help enumerate licences or accounts
// stays vague (TM-X-04).
const MESSAGES = {
  [CODES.BAD_REQUEST]: 'Το αίτημα δεν είναι έγκυρο.',
  [CODES.RATE_LIMITED]: 'Πολλά αιτήματα. Δοκιμάστε ξανά σε λίγα λεπτά.',
  [CODES.INVALID_KEY]: 'Το κλειδί δεν είναι έγκυρο.',
  [CODES.NOT_FOUND]: 'Το κλειδί δεν είναι έγκυρο.',
  [CODES.EXPIRED]: 'Η άδεια έχει λήξει.',
  [CODES.REVOKED]: 'Η άδεια έχει ανακληθεί.',
  [CODES.SEAT_LIMIT]: 'Έχει συμπληρωθεί ο αριθμός ενεργοποιήσεων.',
  [CODES.FEATURE_NOT_GRANTED]: 'Η δυνατότητα δεν περιλαμβάνεται στην άδεια.',
  [CODES.DOMAIN_MISMATCH]: 'Η άδεια είναι δεσμευμένη σε άλλο domain.',
  [CODES.DOWNLOAD_EXPIRED]: 'Ο σύνδεσμος λήξε.',
  [CODES.DOWNLOAD_SIGNATURE]: 'Ο σύνδεσμος δεν είναι έγκυρος.',
  [CODES.WEBHOOK_SIGNATURE]: 'Μη έγκυρη υπογραφή.',
  [CODES.WEBHOOK_REPLAY]: 'Το συμβάν έχει ήδη επεξεργαστεί.',
  [CODES.WEBHOOK_AMOUNT]: 'Το ποσό δεν συμφωνεί με την παραγγελία.',
  [CODES.CONFIG]: 'Η υπηρεσία δεν είναι ρυθμισμένη.',
  [CODES.INTERNAL]: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
};

/**
 * Builds a JSON error response with a stable code.
 * @param {string} code one of CODES
 * @param {number} [status] HTTP status
 * @param {Record<string, unknown>} [extra] extra fields (never secrets)
 */
export function errorResponse(code, status = 400, extra = {}) {
  return Response.json(
    { error: MESSAGES[code] ?? MESSAGES[CODES.INTERNAL], code, ...extra },
    { status, headers: { 'cache-control': 'no-store' } },
  );
}
