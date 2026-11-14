import { onScopeDispose, type Ref, type ShallowRef } from 'vue'

import { isPrimaryPointer, trackPointer } from '../../core/pointer'
import { resizeRect } from '../../core/positioning'
import type { ConstraintOptions, Rect, ResizeHandle, Size } from '../../core/types'
import type { DraggableResizableEmit } from '../types'

export interface UseResizeOptions {
  x: Ref<number>
  y: Ref<number>
  w: Ref<number>
  h: Ref<number>
  /** The handle being dragged, `null` while not resizing. */
  resizingHandle: Ref<ResizeHandle | null>
  enabled: () => boolean
  constraints: Readonly<Ref<ConstraintOptions>>
  parentSize: Readonly<ShallowRef<Size | null>>
  emit: DraggableResizableEmit
}

export const useResize = ({
  x,
  y,
  w,
  h,
  resizingHandle,
  enabled,
  constraints,
  parentSize,
  emit,
}: UseResizeOptions) => {
  let stopTracking: (() => void) | null = null

  const currentRect = (): Rect => ({ x: x.value, y: y.value, w: w.value, h: h.value })

  const onPointerDown = (event: PointerEvent, handle: ResizeHandle) => {
    if (!enabled() || !isPrimaryPointer(event) || stopTracking) return

    const start = currentRect()

    resizingHandle.value = handle
    emit('resize-start', start)

    stopTracking = trackPointer(event, {
      onMove: (deltaX, deltaY) => {
        const next = resizeRect({
          handle,
          start,
          deltaX,
          deltaY,
          options: constraints.value,
          parentSize: parentSize.value,
        })

        x.value = next.x
        y.value = next.y
        w.value = next.w
        h.value = next.h
        emit('resizing', next)
      },
      onEnd: () => {
        stopTracking = null
        resizingHandle.value = null
        emit('resize-end', currentRect())
      },
    })
  }

  onScopeDispose(() => {
    stopTracking?.()
    stopTracking = null
  })

  return { onPointerDown }
}
