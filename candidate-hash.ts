/**
 * Canonical candidate-hash — single source of truth shared between the
 * extension background SW cache (Phase 05 SF-05) and the server `ai_cache`
 * lookup key (Phase 01). Both sides MUST produce identical output for a
 * given candidate set or the cache is useless.
 *
 * Contract:
 *   - Order-independent: [A, B] and [B, A] hash the same.
 *   - Currency-aware: USD 10 and EUR 10 hash differently.
 *   - Precision-safe: amounts normalized to 2-decimal integer cents
 *     before hashing so float drift (0.1 + 0.2 ≠ 0.3) cannot break
 *     cache lookups.
 *   - Hex output: 64-char SHA-256 (compatible with ai_cache.cache_key TEXT).
 *
 * Implementation uses Web Crypto (crypto.subtle), which is available in
 * both Deno edge runtime and the extension service worker. No external deps.
 */

export interface HashableCandidate {
  amount: number
  currency: string
}

/**
 * Build the canonical string form of a candidate set.
 * Exported for test assertion — not for production use.
 */
export function canonicalizeCandidates(candidates: readonly HashableCandidate[]): string {
  return candidates
    .map((c) => {
      const cents = Math.round(c.amount * 100)
      const currency = c.currency.toUpperCase()
      return `${currency}:${cents}`
    })
    .sort()
    .join('|')
}

/**
 * Hash a candidate set with SHA-256. Returns hex string (64 chars).
 * Use this for both the client background cache key AND the server
 * `ai_cache.cache_key` write — identical output on both sides is the
 * whole point of this module.
 */
export async function candidateHash(candidates: readonly HashableCandidate[]): Promise<string> {
  const canonical = canonicalizeCandidates(candidates)
  const bytes = new TextEncoder().encode(canonical)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return toHex(new Uint8Array(digest))
}

function toHex(bytes: Uint8Array): string {
  let hex = ''
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0')
  }
  return hex
}
