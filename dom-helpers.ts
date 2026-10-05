/** Shared DOM helpers for overlay modules (Shadow DOM, vanilla JS) */

export function el(tag: string, className?: string, attrs?: Record<string, string>): HTMLElement {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      node.setAttribute(k, v)
    }
  }
  return node
}

/** Right offset of the expanded panel's host. */
export const EXPANDED_RIGHT = '20px'

/**
 * Apply minimized or expanded sizing to an overlay host element.
 * Used by both main overlay and manual input overlay.
 */
export function applyOverlaySize(element: HTMLElement, minimized: boolean): void {
  const set = (prop: string, value: string) => element.style.setProperty(prop, value, 'important')

  if (minimized) {
    set('width', 'auto')
    set('min-width', '0')
    set('max-width', 'none')
    set('right', '0')
  } else {
    set('width', '430px')
    set('min-width', '430px')
    set('max-width', '430px')
    set('right', EXPANDED_RIGHT)
  }
}

/**
 * Create a delegated click handler that routes clicks by `data-action` attribute.
 * Returns the listener function so it can be removed later.
 */
export function createDelegatedClickHandler(
  root: ShadowRoot,
  handlers: Record<string, () => void>,
  previousListener: EventListener | null
): EventListener {
  if (previousListener) {
    root.removeEventListener('click', previousListener)
  }

  const listener: EventListener = (event: Event) => {
    const target = (event.target as Element).closest?.('[data-action]')
    if (target) {
      const action = (target as HTMLElement).dataset.action
      if (action && handlers[action]) {
        handlers[action]()
      }
    }
  }

  root.addEventListener('click', listener)
  return listener
}
