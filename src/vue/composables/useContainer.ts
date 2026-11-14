import { inject, onScopeDispose, provide, shallowRef, type InjectionKey } from 'vue'

import { collectGuides } from '../../core/guides'
import type { Guides, Rect, SnapOptions } from '../../core/types'
import type { ContainerContext, ContainerMember, SnapSession } from '../types'

const CONTAINER_KEY: InjectionKey<ContainerContext> = Symbol('vdr-container')

/**
 * Sets up a `DraggableContainer`: keeps track of its members and of their snap sessions, and
 * provides it to its elements. Only the most recently started session that has not ended shows its
 * matched guides.
 */
export const provideContainer = (getOptions: () => SnapOptions) => {
  // Rects are only read when a drag starts, so they are pulled instead of tracked reactively.
  const members = new Map<ContainerMember, () => Rect>()
  const matchedGuides = shallowRef<Guides | null>(null)
  // The live sessions, oldest first. Several can overlap, e.g. with one finger per element.
  const sessions: SnapSession[] = []
  const isCurrent = (session: SnapSession) => sessions.at(-1) === session

  const join = (getRect: () => Rect): ContainerMember => {
    // One drag per member at a time.
    let session: SnapSession | null = null

    const member: ContainerMember = {
      startSnap: (parentSize) => {
        session?.end()

        const others = [...members].filter(([key]) => key !== member).map(([, rect]) => rect())

        const started: SnapSession = {
          guides: collectGuides(getOptions(), parentSize, others),
          publish: (matched) => {
            if (isCurrent(started)) matchedGuides.value = matched
          },
          end: () => {
            const index = sessions.indexOf(started)
            if (index === -1) return
            if (session === started) session = null
            // An older session that is still live shows its guides again on its next move.
            if (index === sessions.length - 1) matchedGuides.value = null
            sessions.splice(index, 1)
          },
        }

        sessions.push(started)
        session = started
        matchedGuides.value = null
        return started
      },
    }

    members.set(member, getRect)
    onScopeDispose(() => {
      members.delete(member)
      session?.end()
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
