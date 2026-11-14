import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, reactive, type ShallowRef } from 'vue'

import type { Guides, Rect, SnapOptions } from '../../core/types'
import type { ContainerMember } from '../types'
import { provideContainer, useContainerMember } from './useContainer'

/**
 * A container whose members are plain rects instead of mounted elements. Deleting a rect from
 * `rects` unmounts its member.
 */
const mountContainer = (options: SnapOptions = {}) => {
  const rects = reactive(
    new Map<string, Rect>([
      ['a', { x: 0, y: 0, w: 50, h: 50 }],
      ['b', { x: 200, y: 100, w: 50, h: 50 }],
    ]),
  )
  const members: Record<string, ContainerMember> = {}
  let matchedGuides!: ShallowRef<Guides | null>

  const Member = defineComponent({
    props: { name: { type: String, required: true } },
    setup({ name }) {
      members[name] = useContainerMember(() => rects.get(name)!)!
      return () => null
    },
  })

  const Container = defineComponent(() => {
    matchedGuides = provideContainer(() => options).matchedGuides
    return () => [...rects.keys()].map((name) => h(Member, { key: name, name }))
  })

  mount(Container)
  return { rects, members, matched: () => matchedGuides.value }
}

const someGuides: Guides = { x: [200], y: [] }

describe('provideContainer', () => {
  it('offers the other members as guides, but not the member itself', () => {
    const { members } = mountContainer()
    expect(members.a!.startSnap(null).guides).toEqual({ x: [200, 225, 250], y: [100, 125, 150] })
  })

  it('reads the rects when a drag starts', () => {
    const { rects, members } = mountContainer()
    rects.set('b', { x: 10, y: 20, w: 50, h: 50 })
    expect(members.a!.startSnap(null).guides).toEqual({ x: [10, 35, 60], y: [20, 45, 70] })
  })

  it('snaps to the parent with its size', () => {
    const { members } = mountContainer({ snapToParent: true })
    const { guides } = members.a!.startSnap({ width: 300, height: 300 })
    expect(guides?.x).toEqual(expect.arrayContaining([0, 150, 300]))
  })

  it('offers no guides while disabled', () => {
    const { members } = mountContainer({ disabled: true })
    expect(members.a!.startSnap(null).guides).toBeNull()
  })

  it('forgets members that leave', async () => {
    const { rects, members } = mountContainer()
    rects.delete('b')
    await nextTick()
    expect(members.a!.startSnap(null).guides).toEqual({ x: [], y: [] })
  })

  it('shows the published guides until the session ends', () => {
    const { members, matched } = mountContainer()
    const session = members.a!.startSnap(null)

    session.publish(someGuides)
    expect(matched()).toEqual(someGuides)

    session.end()
    expect(matched()).toBeNull()
  })

  it('lets only the most recently started session show guides', () => {
    const { members, matched } = mountContainer()
    const first = members.a!.startSnap(null)
    first.publish(someGuides)

    const second = members.b!.startSnap(null)
    expect(matched()).toBeNull()

    first.publish({ x: [1], y: [] })
    expect(matched()).toBeNull()

    second.publish(someGuides)
    first.end()
    expect(matched()).toEqual(someGuides)
  })

  it('hides the guides when the member of the session leaves', async () => {
    const { rects, members, matched } = mountContainer()
    members.a!.startSnap(null).publish(someGuides)

    rects.delete('b')
    await nextTick()
    expect(matched()).toEqual(someGuides)

    rects.delete('a')
    await nextTick()
    expect(matched()).toBeNull()
  })
})
