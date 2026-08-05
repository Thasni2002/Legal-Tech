/**
 * Vault Session Utilities
 * ========================
 * Manages client-side vault unlock state in sessionStorage.
 *
 * Key design decisions:
 *  - Uses sessionStorage (not localStorage) → cleared on tab/browser close
 *  - 30-minute inactivity timeout → auto-re-lock
 *  - Every read refreshes the activity timestamp
 *  - Token is a signed JWT from the backend vault unlock endpoint
 */

const VAULT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

function _key(caseId) {
  return `vault_session_${caseId}`;
}

/**
 * Store a vault token after successful unlock.
 * @param {number|string} caseId
 * @param {string} token — vault JWT from backend
 */
export function setVaultSession(caseId, token) {
  try {
    sessionStorage.setItem(
      _key(caseId),
      JSON.stringify({ token, lastActive: Date.now() })
    );
  } catch (_) {}
}

/**
 * Check if the vault for a given caseId is currently unlocked.
 * Returns the vault token string if unlocked, false otherwise.
 * Also refreshes the lastActive timestamp on every successful read.
 *
 * @param {number|string} caseId
 * @returns {string|false}
 */
export function isVaultUnlocked(caseId) {
  try {
    const raw = sessionStorage.getItem(_key(caseId));
    if (!raw) return false;

    const { token, lastActive } = JSON.parse(raw);
    if (!token) return false;

    // Check inactivity timeout
    if (Date.now() - lastActive > VAULT_TIMEOUT_MS) {
      sessionStorage.removeItem(_key(caseId));
      return false;
    }

    // Refresh activity timestamp
    sessionStorage.setItem(
      _key(caseId),
      JSON.stringify({ token, lastActive: Date.now() })
    );
    return token;
  } catch (_) {
    return false;
  }
}

/**
 * Explicitly lock a confidential case (e.g. on manual lock button).
 * @param {number|string} caseId
 */
export function clearVaultSession(caseId) {
  try {
    sessionStorage.removeItem(_key(caseId));
  } catch (_) {}
}

/**
 * Refresh the activity timestamp without re-reading the token.
 * Call this on user interactions inside a confidential case view.
 * @param {number|string} caseId
 */
export function refreshVaultActivity(caseId) {
  try {
    const raw = sessionStorage.getItem(_key(caseId));
    if (!raw) return;
    const parsed = JSON.parse(raw);
    parsed.lastActive = Date.now();
    sessionStorage.setItem(_key(caseId), JSON.stringify(parsed));
  } catch (_) {}
}

/**
 * Returns the stored vault token (no timeout check — use isVaultUnlocked for guarded access).
 * @param {number|string} caseId
 * @returns {string|null}
 */
export function getVaultToken(caseId) {
  try {
    const raw = sessionStorage.getItem(_key(caseId));
    if (!raw) return null;
    return JSON.parse(raw).token || null;
  } catch (_) {
    return null;
  }
}
