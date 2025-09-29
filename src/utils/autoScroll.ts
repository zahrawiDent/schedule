/**
 * autoScroll
 * ----------
 * Window auto-scroll utility for drag/resize operations. Starts a requestAnimationFrame loop
 * that scrolls the window when the pointer nears the viewport edges.
 *
 * API: const { start, stop } = createAutoScroll(edgePx?, maxSpeed?)
 */
export function createAutoScroll(edge = 28, speed = 20) {
  let autoRaf = 0
  const ptr = { x: 0, y: 0 }
  const onPtrMove = (e: PointerEvent) => { ptr.x = (e as any).clientX; ptr.y = (e as any).clientY }
  const tick = () => {
    const yTop = ptr.y
    const yBottom = window.innerHeight - ptr.y
    let delta = 0
    if (yTop < edge) delta = -Math.ceil(((edge - yTop) / edge) * speed)
    else if (yBottom < edge) delta = Math.ceil(((edge - yBottom) / edge) * speed)
    if (delta !== 0) window.scrollBy(0, delta)
    autoRaf = window.requestAnimationFrame(tick)
  }
  const start = () => {
    if (autoRaf) return
    window.addEventListener('pointermove', onPtrMove)
    autoRaf = window.requestAnimationFrame(tick)
  }
  const stop = () => {
    if (!autoRaf) return
    window.cancelAnimationFrame(autoRaf)
    autoRaf = 0
    window.removeEventListener('pointermove', onPtrMove)
  }
  return { start, stop }
}
