export interface PointerSessionHandlers {
  /** Called on every move with the distance travelled since the session started. */
  onMove: (deltaX: number, deltaY: number, event: PointerEvent) => void
  /** Called once when the pointer is released or the gesture is cancelled. */
  onEnd: () => void
}

/**
 * Follows the pointer that triggered `startEvent` until it is released. Listeners live on the
 * document so the gesture continues outside the element. Returns a function that aborts the
 * session without calling `onEnd`.
 */
export const trackPointer = (
  startEvent: PointerEvent,
  { onMove, onEnd }: PointerSessionHandlers,
): (() => void) => {
  const target = (startEvent.currentTarget as Node | null)?.ownerDocument ?? document
  const { pointerId, clientX: startX, clientY: startY } = startEvent

  const controller = new AbortController()
  const stop = () => controller.abort()

  const handleMove = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return
    onMove(event.clientX - startX, event.clientY - startY, event)
  }

  const handleEnd = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return
    stop()
    onEnd()
  }

  const { signal } = controller
  target.addEventListener('pointermove', handleMove, { signal })
  target.addEventListener('pointerup', handleEnd, { signal })
  target.addEventListener('pointercancel', handleEnd, { signal })

  return stop
}

/** Whether a pointerdown should start a gesture: primary mouse button, touch contact or pen tip. */
export const isPrimaryPointer = (event: PointerEvent) => event.button === 0
