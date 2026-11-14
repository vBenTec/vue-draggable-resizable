import { onScopeDispose, type Ref, type ShallowRef } from 'vue'

import { isPrimaryPointer, trackPointer } from '../../core/pointer'
import { calculateSizeLimits, constrainPosition, moveRect } from '../../core/positioning'
import { getMatchedLines, snapToReferenceLines } from '../../core/reference-lines'
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

    const startX = x.value
    const startY = y.value
    const referenceLines = container?.getReferenceLines(id, parentSize.value) ?? null

    dragging.value = true
    emit('drag-start', { x: startX, y: startY })

    stopTracking = trackPointer(event, {
      onMove: (deltaX, deltaY) => {
        const options = constraints.value
        const start: Rect = { x: startX, y: startY, w: w.value, h: h.value }
        const limits = calculateSizeLimits(options, parentSize.value, start.w, start.h)

        let { x: nextX, y: nextY } = constrainPosition(
          moveRect(start, deltaX, deltaY, options),
          limits,
          options,
        )

        if (referenceLines) {
          const snapped = snapToReferenceLines({ ...start, x: nextX, y: nextY }, referenceLines, {
            x: !options.disabledX,
            y: !options.disabledY,
          })
          // Snapping must never push the element out of its bounds.
          ;({ x: nextX, y: nextY } = constrainPosition({ ...start, ...snapped }, limits, options))

          container?.setMatchedLines(
            getMatchedLines({ ...start, x: nextX, y: nextY }, referenceLines),
          )
        }

        x.value = nextX
        y.value = nextY
        emit('dragging', { x: nextX, y: nextY })
      },
      onEnd: () => {
        stopTracking = null
        dragging.value = false
        container?.setMatchedLines(null)
        emit('drag-end', { x: x.value, y: y.value })
      },
    })
  }

  onScopeDispose(() => {
    if (!stopTracking) return
    stopTracking()
    stopTracking = null
    container?.setMatchedLines(null)
  })

  return { onPointerDown }
}
