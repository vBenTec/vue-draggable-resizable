import { onScopeDispose, type Ref, type ShallowRef } from 'vue'

import { isPrimaryPointer, trackPointer } from '../../core/pointer'
import { dragRect } from '../../core/positioning'
import type { ConstraintOptions, Rect, Size } from '../../core/types'
import type { ContainerContext, DraggableResizableEmit } from '../types'

export interface UseDragOptions {
  id: string
  x: Ref<number>
  y: Ref<number>
  w: Readonly<Ref<number>>
  h: Readonly<Ref<number>>
  dragging: Ref<boolean>
  enabled: () => boolean
  constraints: Readonly<Ref<ConstraintOptions>>
  parentSize: Readonly<ShallowRef<Size | null>>
  container: ContainerContext | null
  emit: DraggableResizableEmit
}

export const useDrag = ({
  id,
  x,
  y,
  w,
  h,
  dragging,
  enabled,
  constraints,
  parentSize,
  container,
  emit,
}: UseDragOptions) => {
  let stopTracking: (() => void) | null = null

  const onPointerDown = (event: PointerEvent) => {
    if (!enabled() || !isPrimaryPointer(event) || stopTracking) return

    const start: Rect = { x: x.value, y: y.value, w: w.value, h: h.value }
    const guides = container?.getGuides(id, parentSize.value) ?? null

    dragging.value = true
    emit('drag-start', { x: start.x, y: start.y })

    stopTracking = trackPointer(event, {
      onMove: (deltaX, deltaY) => {
        const next = dragRect({
          start,
          deltaX,
          deltaY,
          options: constraints.value,
          parentSize: parentSize.value,
          guides,
        })

        if (next.matchedGuides) container?.setMatchedGuides(next.matchedGuides)

        x.value = next.x
        y.value = next.y
        emit('dragging', { x: next.x, y: next.y })
      },
      onEnd: () => {
        stopTracking = null
        dragging.value = false
        container?.setMatchedGuides(null)
        emit('drag-end', { x: x.value, y: y.value })
      },
    })
  }

  onScopeDispose(() => {
    if (!stopTracking) return
    stopTracking()
    stopTracking = null
    container?.setMatchedGuides(null)
  })

  return { onPointerDown }
}
