import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { Window } from 'happy-dom'
import { el, applyOverlaySize, createDelegatedClickHandler } from './dom-helpers'

let window: Window
let originalDocument: typeof globalThis.document

beforeAll(() => {
  window = new Window()
  originalDocument = globalThis.document
  // @ts-expect-error - happy-dom document assignment
  globalThis.document = window.document
})

afterAll(() => {
  globalThis.document = originalDocument
  window.close()
})

describe('el()', () => {
  it('creates element with given tag', () => {
    const node = el('div')
    expect(node.tagName.toLowerCase()).toBe('div')
  })

  it('sets className when provided', () => {
    const node = el('span', 'my-class')
    expect(node.className).toBe('my-class')
  })

  it('leaves className empty when omitted', () => {
    const node = el('div')
    expect(node.className).toBe('')
  })

  it('sets attributes from attrs map', () => {
    const node = el('button', 'btn', { 'data-action': 'submit', type: 'button' })
    expect(node.getAttribute('data-action')).toBe('submit')
    expect(node.getAttribute('type')).toBe('button')
  })

  it('works with no className or attrs', () => {
    const node = el('p')
    expect(node.tagName.toLowerCase()).toBe('p')
    expect(node.className).toBe('')
  })
})

describe('applyOverlaySize()', () => {
  it('sets minimized styles when minimized=true', () => {
    const node = el('div')
    applyOverlaySize(node, true)
    expect(node.style.getPropertyValue('width')).toBe('auto')
    // happy-dom normalises bare 0 → 0px for length properties
    expect(['0', '0px']).toContain(node.style.getPropertyValue('min-width'))
    expect(node.style.getPropertyValue('max-width')).toBe('none')
    expect(['0', '0px']).toContain(node.style.getPropertyValue('right'))
  })

  it('sets expanded styles when minimized=false', () => {
    const node = el('div')
    applyOverlaySize(node, false)
    expect(node.style.getPropertyValue('width')).toBe('430px')
    expect(node.style.getPropertyValue('min-width')).toBe('430px')
    expect(node.style.getPropertyValue('max-width')).toBe('430px')
    expect(node.style.getPropertyValue('right')).toBe('20px')
  })
})

describe('createDelegatedClickHandler()', () => {
  function makeShadowRoot(): ShadowRoot {
    const host = document.createElement('div')
    document.body.appendChild(host)
    return host.attachShadow({ mode: 'open' })
  }

  it('routes click to matching data-action handler', () => {
    const root = makeShadowRoot()
    const calls: string[] = []

    createDelegatedClickHandler(root, { 'do-thing': () => calls.push('do-thing') }, null)

    const btn = document.createElement('button')
    btn.setAttribute('data-action', 'do-thing')
    root.appendChild(btn)
    btn.click()

    expect(calls).toEqual(['do-thing'])
  })

  it('ignores clicks on elements with no data-action', () => {
    const root = makeShadowRoot()
    const calls: string[] = []

    createDelegatedClickHandler(root, { 'do-thing': () => calls.push('do-thing') }, null)

    const btn = document.createElement('button')
    root.appendChild(btn)
    btn.click()

    expect(calls).toEqual([])
  })

  it('ignores unknown data-action values', () => {
    const root = makeShadowRoot()
    const calls: string[] = []

    createDelegatedClickHandler(root, { known: () => calls.push('known') }, null)

    const btn = document.createElement('button')
    btn.setAttribute('data-action', 'unknown-action')
    root.appendChild(btn)
    btn.click()

    expect(calls).toEqual([])
  })

  it('removes the previous listener before adding new one', () => {
    const root = makeShadowRoot()
    const firstCalls: string[] = []
    const secondCalls: string[] = []

    const first = createDelegatedClickHandler(
      root,
      { action: () => firstCalls.push('first') },
      null
    )

    const btn = document.createElement('button')
    btn.setAttribute('data-action', 'action')
    root.appendChild(btn)

    // Replace with second handler, passing first as previousListener
    createDelegatedClickHandler(root, { action: () => secondCalls.push('second') }, first)

    btn.click()

    expect(firstCalls).toEqual([])
    expect(secondCalls).toEqual(['second'])
  })
})
