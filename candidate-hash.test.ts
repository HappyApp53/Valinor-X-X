import { describe, it, expect } from 'bun:test'
import { canonicalizeCandidates, candidateHash } from './candidate-hash'

describe('canonicalizeCandidates', () => {
  it('is order-independent', () => {
    const a = canonicalizeCandidates([
      { amount: 10, currency: 'USD' },
      { amount: 20, currency: 'USD' },
    ])
    const b = canonicalizeCandidates([
      { amount: 20, currency: 'USD' },
      { amount: 10, currency: 'USD' },
    ])
    expect(a).toBe(b)
  })

  it('is currency-aware', () => {
    const usd = canonicalizeCandidates([{ amount: 10, currency: 'USD' }])
    const eur = canonicalizeCandidates([{ amount: 10, currency: 'EUR' }])
    expect(usd).not.toBe(eur)
  })

  it('normalizes case-different currencies', () => {
    const upper = canonicalizeCandidates([{ amount: 10, currency: 'USD' }])
    const lower = canonicalizeCandidates([{ amount: 10, currency: 'usd' }])
    expect(upper).toBe(lower)
  })

  it('normalizes floating-point precision via integer cents', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in IEEE 754
    const a = canonicalizeCandidates([{ amount: 0.1 + 0.2, currency: 'USD' }])
    const b = canonicalizeCandidates([{ amount: 0.3, currency: 'USD' }])
    expect(a).toBe(b)
  })

  it('distinguishes near-but-not-equal amounts', () => {
    const cheap = canonicalizeCandidates([{ amount: 9.99, currency: 'USD' }])
    const expensive = canonicalizeCandidates([{ amount: 10.0, currency: 'USD' }])
    expect(cheap).not.toBe(expensive)
  })

  it('produces predictable format', () => {
    const s = canonicalizeCandidates([
      { amount: 10, currency: 'USD' },
      { amount: 20.5, currency: 'EUR' },
    ])
    expect(s).toBe('EUR:2050|USD:1000')
  })

  it('handles empty candidate list', () => {
    expect(canonicalizeCandidates([])).toBe('')
  })
})

describe('candidateHash', () => {
  // Pinned to an independently computed digest (printf 'USD:1000' | shasum -a 256)
  // so a change to the canonical form — e.g. lowercasing the currency — breaks
  // this test instead of silently invalidating every cached key.
  it('hashes $10 as sha256("USD:1000")', async () => {
    const expected = '70f74f1116477d85f873bea12d5cc3837da73214698f689274f6024d1128b8d3'
    expect(await candidateHash([{ amount: 10, currency: 'USD' }])).toBe(expected)
    expect(await candidateHash([{ amount: 10, currency: 'usd' }])).toBe(expected)
  })

  it('returns 64-char hex (SHA-256)', async () => {
    const hash = await candidateHash([{ amount: 10, currency: 'USD' }])
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is order-independent', async () => {
    const a = await candidateHash([
      { amount: 10, currency: 'USD' },
      { amount: 20, currency: 'USD' },
      { amount: 30, currency: 'USD' },
    ])
    const b = await candidateHash([
      { amount: 30, currency: 'USD' },
      { amount: 10, currency: 'USD' },
      { amount: 20, currency: 'USD' },
    ])
    expect(a).toBe(b)
  })

  it('produces different hashes for different amounts', async () => {
    const a = await candidateHash([{ amount: 10, currency: 'USD' }])
    const b = await candidateHash([{ amount: 20, currency: 'USD' }])
    expect(a).not.toBe(b)
  })

  it('produces different hashes for different currencies', async () => {
    const a = await candidateHash([{ amount: 10, currency: 'USD' }])
    const b = await candidateHash([{ amount: 10, currency: 'EUR' }])
    expect(a).not.toBe(b)
  })

  it('is deterministic across multiple calls', async () => {
    const input = [
      { amount: 5.337, currency: 'PLN' },
      { amount: 1.234, currency: 'PLN' },
    ]
    const a = await candidateHash(input)
    const b = await candidateHash(input)
    expect(a).toBe(b)
  })

  it('empty candidate set produces a stable hash', async () => {
    const a = await candidateHash([])
    const b = await candidateHash([])
    expect(a).toBe(b)
    expect(a).toMatch(/^[0-9a-f]{64}$/)
  })
})
