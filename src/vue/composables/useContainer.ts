import { inject, provide, shallowRef, type InjectionKey } from 'vue'

import { collectGuides } from '../../core/guides'
import type { Guides, Rect, SnapOptions } from '../../core/types'
import type { ContainerContext } from '../types'

const CONTAINER_KEY: InjectionKey<ContainerContext> = Symbol('vdr-container')

/** Sets up the position store of a `DraggableContainer` and provides it to its elements. */
export const provideContainer = (getOptions: () => SnapOptions) => {
  // Only read when a drag starts, so it does not need to be reactive.
  const positions = new Map<string, Rect>()
  const matchedGuides = shallowRef<Guides | null>(null)

  provide(CONTAINER_KEY, {
    updatePosition: (id, rect) => {
      positions.set(id, rect)
    },
    removePosition: (id) => {
      positions.delete(id)
    },
    getGuides: (id, parentSize) => {
      const others = [...positions].filter(([key]) => key !== id).map(([, rect]) => rect)
      return collectGuides(getOptions(), parentSize, others)
    },
    setMatchedGuides: (guides) => {
      matchedGuides.value = guides
    },
  })

  return { matchedGuides }
}

export const useContainer = () => inject(CONTAINER_KEY, null)
