import { onScopeDispose, readonly, shallowRef, type Ref, type ShallowRef } from 'vue'

import { isPrimaryPointer, trackPointer, type PointerSessionHandlers } from '../../core/pointer'
import { dragRect, resizeRect } from '../../core/positioning'
import type { ConstraintOptions, Rect, ResizeHandle } from '../../core/types'
import type { ContainerMember, DraggableResizableEmit } from '../types'
import { useParentSize } from './useParentSize'

/** The gesture an element is performing: a drag, or a resize by one of its handles. */
export type Gesture = { kind: 'drag' } | { kind: 'resize'; handle: ResizeHandle }

export interface UseGestureOptions {
  /** The element; its parent is measured for `parent` bounds and snapping. */
  root: Readonly<ShallowRef<HTMLElement | null>>
  rect: Ref<Rect>
  constraints: Readonly<Ref<ConstraintOptions>>
  draggable: () => boolean
  resizable: () => boolean
  /** Membership in a `DraggableContainer`, for snapping while dragging. */
  member: ContainerMember | null
  emit: DraggableResizableEmit
}

/**
 * Drags and resizes an element, one gesture at a time. Re-measures the parent when a gesture
 * starts and stops tracking the pointer when the owning scope is disposed.
 */
export const useGesture = ({
  root,
  rect,
  constraints,
  draggable,
  resizable,
  member,
  emit,
}: UseGestureOptions) => {
  const gesture = shallowRef<Gesture | null>(null)
  let stopTracking: (() => void) | null = null

  // The parent's size is needed for `parent` bounds and for snapping to the parent's edges.
  const { parentSize, refresh: refreshParentSize } = useParentSize(
    root,
    () => !!constraints.value.parent || member !== null,
  )

  /** Whether `event` may start a gesture; if so, brings the parent's size up to date. */
  const canStart = (event: PointerEvent, enabled: boolean) => {
    if (!enabled || gesture.value || !isPrimaryPointer(event)) return false
    refreshParentSize()
    return true
  }

  const track = (event: PointerEvent, { onMove, onEnd }: PointerSessionHandlers) => {
    stopTracking = trackPointer(event, {
      onMove,
      onEnd: () => {
        stopTracking = null
        gesture.value = null
        onEnd()
      },
    })
  }

  const startDrag = (event: PointerEvent) => {
    if (!canStart(event, draggable())) return

    const start = rect.value
    const snap = member?.startSnap(parentSize.value) ?? null

    gesture.value = { kind: 'drag' }
    emit('drag-start', { x: start.x, y: start.y })

    track(event, {
      onMove: (deltaX, deltaY) => {
        const next = dragRect({
          start,
          deltaX,
          deltaY,
          options: constraints.value,
          parentSize: parentSize.value,
          guides: snap?.guides ?? null,
        })

        snap?.publish(next.matchedGuides)

        rect.value = { ...rect.value, x: next.x, y: next.y }
        emit('dragging', { x: next.x, y: next.y })
      },
      onEnd: () => {
        snap?.end()
        emit('drag-end', { x: rect.value.x, y: rect.value.y })
      },
    })
  }

  const startResize = (event: PointerEvent, handle: ResizeHandle) => {
    if (!canStart(event, resizable())) return

    const start = rect.value

    gesture.value = { kind: 'resize', handle }
    emit('resize-start', start)

    track(event, {
      onMove: (deltaX, deltaY) => {
        const next = resizeRect({
          handle,
          start,
          deltaX,
          deltaY,
          options: constraints.value,
          parentSize: parentSize.value,
        })

        rect.value = next
        emit('resizing', next)
      },
      onEnd: () => emit('resize-end', rect.value),
    })
  }

  // Unmounting mid-gesture stops it without emitting an end event. The container hides the
  // matched guides itself when the member leaves.
  onScopeDispose(() => {
    stopTracking?.()
    stopTracking = null
  })

  return { gesture: readonly(gesture), startDrag, startResize }
}
