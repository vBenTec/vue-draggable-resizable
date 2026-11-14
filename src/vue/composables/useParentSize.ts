import { onWatcherCleanup, shallowRef, watch, type ShallowRef } from 'vue'

import type { Size } from '../../core/types'

/**
 * Tracks the inner size of an element's parent (the box absolutely positioned children are laid
 * out in). Measures once the element is mounted and whenever the parent resizes; `null` while
 * disabled or before mount.
 */
export const useParentSize = (
  element: Readonly<ShallowRef<HTMLElement | null>>,
  enabled: () => boolean,
) => {
  const parentSize = shallowRef<Size | null>(null)

  const measure = () => {
    const parent = element.value?.parentElement
    parentSize.value =
      parent && enabled() ? { width: parent.clientWidth, height: parent.clientHeight } : null
  }

  // `sync`: the template ref is set right after the element is inserted, so this starts observing
  // during mount (like `onMounted`) instead of a tick later. Stopped together with the component,
  // which also disconnects the observer.
  watch(
    [element, enabled],
    ([el, on]) => {
      const parent = on ? el?.parentElement : null
      measure()
      if (!parent || typeof ResizeObserver === 'undefined') return

      const observer = new ResizeObserver(measure)
      observer.observe(parent)
      onWatcherCleanup(() => observer.disconnect())
    },
    { immediate: true, flush: 'sync' },
  )

  return {
    parentSize,
    /** Re-measure right now, e.g. when a gesture starts. */
    refresh: measure,
  }
}
