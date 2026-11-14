import { onBeforeUnmount, onMounted, shallowRef, watch, type ShallowRef } from 'vue'

import type { Size } from '../../core/types'

/**
 * Tracks the inner size of an element's parent (the box absolutely positioned children are laid
 * out in). Measures on mount and whenever the parent resizes; `null` while disabled or unmounted.
 */
export const useParentSize = (
  element: Readonly<ShallowRef<HTMLElement | null>>,
  enabled: () => boolean,
) => {
  const parentSize = shallowRef<Size | null>(null)
  let observer: ResizeObserver | null = null
  let mounted = false

  const measure = () => {
    const parent = element.value?.parentElement
    parentSize.value =
      parent && enabled() ? { width: parent.clientWidth, height: parent.clientHeight } : null
  }

  const stop = () => {
    observer?.disconnect()
    observer = null
  }

  const start = () => {
    stop()
    measure()

    const parent = element.value?.parentElement
    if (!parent || !enabled() || typeof ResizeObserver === 'undefined') return

    observer = new ResizeObserver(measure)
    observer.observe(parent)
  }

  onMounted(() => {
    mounted = true
    start()
  })

  watch(enabled, () => {
    if (mounted) start()
  })

  onBeforeUnmount(() => {
    mounted = false
    stop()
  })

  return {
    parentSize,
    /** Re-measure right now, e.g. when a gesture starts. */
    refresh: measure,
  }
}
