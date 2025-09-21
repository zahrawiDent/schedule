/**
 * Track a vertical pointer drag and report dy in pixels.
 * Returns a handler you can attach to onPointerDown.
 */
export function withPointer(onMove: (dy: number, ev: PointerEvent) => void, onUp?: () => void) {
  return (e: PointerEvent) => {
    const startY = (e as any).clientY
    const onMoveH = (ev: PointerEvent) => onMove(((ev as any).clientY - startY), ev)
    const onUpH = () => {
      window.removeEventListener('pointermove', onMoveH)
      window.removeEventListener('pointerup', onUpH)
      onUp?.()
    }
    window.addEventListener('pointermove', onMoveH)
    window.addEventListener('pointerup', onUpH, { once: true } as any)
  }
}

/**
 * Track a 2D pointer drag and report dx/dy in pixels.
 * Returns a handler you can attach to onPointerDown.
 */
export function withPointer2D(onMove: (dx: number, dy: number, ev: PointerEvent) => void, onUp?: () => void) {
  return (e: PointerEvent) => {
    const startX = (e as any).clientX
    const startY = (e as any).clientY
    const onMoveH = (ev: PointerEvent) => onMove(((ev as any).clientX - startX), ((ev as any).clientY - startY), ev)
    const onUpH = () => {
      window.removeEventListener('pointermove', onMoveH)
      window.removeEventListener('pointerup', onUpH)
      onUp?.()
    }
    window.addEventListener('pointermove', onMoveH)
    window.addEventListener('pointerup', onUpH, { once: true } as any)
  }
}
