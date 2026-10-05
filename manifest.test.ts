import { describe, expect, it } from 'bun:test'
import manifest from './manifest.json'

describe('extension manifest', () => {
  // <all_urls> host access already covers every tab; activeTab only widened the grant list.
  it('asks only for storage', () => {
    expect(manifest.permissions).toEqual(['storage'])
  })
})
