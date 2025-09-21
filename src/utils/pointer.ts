/**
 * Track a vertical pointer drag and report dy in pixels.
 * Returns a handler you can attach to onPointerDown.
 */
export function withPointer(onMove: (dy: number, ev: PointerEvent) => void, onUp?: () => void) {
  return (e: PointerEvent) => {
    try {
      // Improve drag robustness: capture pointer so scrolling doesn't cancel moves
      (e.target as any)?.setPointerCapture?.((e as any).pointerId)
    } catch {}
    // Prevent native text selection/touch scrolling starting from the drag source
    try { (e as any).preventDefault?.() } catch {}
    const startY = (e as any).clientY
    const onMoveH = (ev: PointerEvent) => onMove(((ev as any).clientY - startY), ev)
    const onUpH = (ev: PointerEvent) => {
      // Fire one last move using the up event to account for any scroll during drag without movement
      try { onMove(((ev as any).clientY - startY), ev) } catch {}
      window.removeEventListener('pointermove', onMoveH)
      window.removeEventListener('pointerup', onUpH)
      window.removeEventListener('pointercancel', onUpH)
      onUp?.()
    }
    window.addEventListener('pointermove', onMoveH)
    window.addEventListener('pointerup', onUpH, { once: true } as any)
    window.addEventListener('pointercancel', onUpH, { once: true } as any)
  }
}

/**
 * Track a 2D pointer drag and report dx/dy in pixels.
 * Returns a handler you can attach to onPointerDown.
 */
export function withPointer2D(onMove: (dx: number, dy: number, ev: PointerEvent) => void, onUp?: () => void) {
  return (e: PointerEvent) => {
    try {
      (e.target as any)?.setPointerCapture?.((e as any).pointerId)
    } catch {}
    try { (e as any).preventDefault?.() } catch {}
    const startX = (e as any).clientX
    const startY = (e as any).clientY
    const onMoveH = (ev: PointerEvent) => onMove(((ev as any).clientX - startX), ((ev as any).clientY - startY), ev)
    const onUpH = (ev: PointerEvent) => {
      // Final sync on pointerup with current coordinates
      try { onMove(((ev as any).clientX - startX), ((ev as any).clientY - startY), ev) } catch {}
      window.removeEventListener('pointermove', onMoveH)
      window.removeEventListener('pointerup', onUpH)
      window.removeEventListener('pointercancel', onUpH)
      onUp?.()
    }
    window.addEventListener('pointermove', onMoveH)
    window.addEventListener('pointerup', onUpH, { once: true } as any)
    window.addEventListener('pointercancel', onUpH, { once: true } as any)
  }
}
