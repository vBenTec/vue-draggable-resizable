import { inject, onScopeDispose, provide, shallowRef, type InjectionKey } from 'vue'

import { collectGuides } from '../../core/guides'
import type { Guides, Rect, SnapOptions } from '../../core/types'
import type { ContainerContext, ContainerMember, SnapSession } from '../types'

const CONTAINER_KEY: InjectionKey<ContainerContext> = Symbol('vdr-container')

/**
 * Sets up a `DraggableContainer`: keeps track of its members and of the snap session that may show
 * matched guides, and provides it to its elements.
 */
export const provideContainer = (getOptions: () => SnapOptions) => {
  // Rects are only read when a drag starts, so they are pulled instead of tracked reactively.
  const members = new Map<ContainerMember, () => Rect>()
  const matchedGuides = shallowRef<Guides | null>(null)
  let current: { session: SnapSession; member: ContainerMember } | null = null

  const join = (getRect: () => Rect): ContainerMember => {
    const member: ContainerMember = {
      startSnap: (parentSize) => {
        const others = [...members].filter(([key]) => key !== member).map(([, rect]) => rect())

        const session: SnapSession = {
          guides: collectGuides(getOptions(), parentSize, others),
          publish: (matched) => {
            if (current?.session === session) matchedGuides.value = matched
          },
          end: () => {
            if (current?.session !== session) return
            current = null
            matchedGuides.value = null
          },
        }

        // A newer drag takes over, e.g. with a second finger on another element.
        current = { session, member }
        matchedGuides.value = null
        return session
      },
    }

    members.set(member, getRect)
    onScopeDispose(() => {
      members.delete(member)
      if (current?.member === member) current.session.end()
    })

    return member
  }

  provide(CONTAINER_KEY, { join })

  return { matchedGuides }
}

/**
 * Registers the calling element with the surrounding `DraggableContainer`, if any, until its scope
 * is disposed. `null` outside a container.
 */
export const useContainerMember = (getRect: () => Rect) =>
  inject(CONTAINER_KEY, null)?.join(getRect) ?? null
