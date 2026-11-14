import { nextTick } from 'vue'

type PointerType = 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel'

export const pointer = (
  target: EventTarget,
  type: PointerType,
  x = 0,
  y = 0,
  init: PointerEventInit = {},
) =>
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerId: 1,
      button: 0,
      clientX: x,
      clientY: y,
      ...init,
    }),
  )

/** Presses on `target`, moves by the given distance and releases. */
export const dragBy = async (target: Element, deltaX: number, deltaY: number) => {
  pointer(target, 'pointerdown', 100, 100)
  pointer(document, 'pointermove', 100 + deltaX, 100 + deltaY)
  pointer(document, 'pointerup', 100 + deltaX, 100 + deltaY)
  await nextTick()
}

/** happy-dom does not lay anything out, so tests state the inner size of an element. */
export const setInnerSize = (element: Element, width: number, height: number) => {
  Object.defineProperty(element, 'clientWidth', { configurable: true, get: () => width })
  Object.defineProperty(element, 'clientHeight', { configurable: true, get: () => height })
}

export const rectOf = (element: Element) => {
  const { left, top, width, height } = (element as HTMLElement).style
  return { x: parseFloat(left), y: parseFloat(top), w: parseFloat(width), h: parseFloat(height) }
}
