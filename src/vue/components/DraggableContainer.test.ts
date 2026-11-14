import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, reactive } from 'vue'

import { pointer, rectOf, setInnerSize } from '../../test-utils'
import type { DraggableContainerProps } from '../types'
import DraggableContainer from './DraggableContainer.vue'
import DraggableResizable from './DraggableResizable.vue'

const release = async () => {
  pointer(document, 'pointerup')
  await nextTick()
}

/**
 * Two 50x50 elements in a 300x300 container: `a` at 0/0 is the one being dragged, `b` sits at
 * 200/100.
 */
const mountContainer = (containerProps: DraggableContainerProps = {}) => {
  const state = reactive({
    showB: true,
    parent: false,
    b: { x: 200, y: 100, w: 50, h: 50 },
    container: containerProps,
  })

  const App = defineComponent(
    () => () =>
      h(DraggableContainer, state.container, () => [
        h(DraggableResizable, { class: 'a', initW: 50, initH: 50, parent: state.parent }),
        state.showB ? h(DraggableResizable, { class: 'b', ...state.b }) : null,
      ]),
  )

  const wrapper = mount(App, { attachTo: document.body })
  setInnerSize(wrapper.get('.vdr-snap-container').element, 300, 300)

  const a = wrapper.get('.a').element
  const guides = (axis: 'x' | 'y') =>
    wrapper
      .findAll(`.vdr-guide-${axis}`)
      .map((guide) =>
        parseFloat((guide.element as HTMLElement).style[axis === 'x' ? 'left' : 'top']),
      )

  /** Drags `a` from its origin to the given position and keeps the pointer down. */
  const dragATo = async (x: number, y: number) => {
    pointer(a, 'pointerdown', 0, 0)
    pointer(document, 'pointermove', x, y)
    await nextTick()
  }

  return { wrapper, state, a, guides, dragATo }
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('DraggableContainer', () => {
  it('snaps to other elements and shows the matching guides while dragging', async () => {
    const { a, guides, dragATo } = mountContainer()

    // Right edge (x + 50) lands 3px before b's left edge, top 4px below b's top.
    await dragATo(147, 104)
    expect(rectOf(a)).toMatchObject({ x: 150, y: 100 })
    // a's left edge also happens to sit on the container's centre line.
    expect(guides('x')).toEqual([150, 200])
    expect(guides('y')).toEqual([150, 100, 125])

    await release()
    expect(guides('x')).toEqual([])
    expect(guides('y')).toEqual([])
  })

  it('does not snap outside the threshold', async () => {
    const { a, guides, dragATo } = mountContainer()
    await dragATo(140, 30)
    expect(rectOf(a)).toMatchObject({ x: 140, y: 30 })
    expect(guides('x')).toEqual([])
  })

  it('snaps to the parent edges and centre unless snapToParent is off', async () => {
    const { a, state, guides, dragATo } = mountContainer()

    await dragATo(123, 3)
    expect(rectOf(a)).toMatchObject({ x: 125, y: 0 })
    expect(guides('x')).toEqual([150])
    expect(guides('y')).toEqual([0])
    await release()

    state.container = { snapToParent: false }
    await nextTick()
    pointer(a, 'pointerdown', 0, 0)
    pointer(document, 'pointermove', -2, 3)
    await nextTick()
    expect(rectOf(a)).toMatchObject({ x: 123, y: 3 })
  })

  it('snaps to custom guides', async () => {
    const { a, guides, dragATo } = mountContainer({ guidesX: [33], guidesY: [60] })
    await dragATo(35, 58)
    expect(rectOf(a)).toMatchObject({ x: 33, y: 60 })
    expect(guides('x')).toEqual([33])
    expect(guides('y')).toEqual([60])
  })

  it('does nothing while disabled', async () => {
    const { a, guides, dragATo } = mountContainer({ disabled: true })
    await dragATo(147, 104)
    expect(rectOf(a)).toMatchObject({ x: 147, y: 104 })
    expect(guides('x')).toEqual([])
  })

  it('can hide the guides and recolour them', async () => {
    const { wrapper, state, guides, dragATo } = mountContainer({ guideColor: '#0f0' })
    const container = wrapper.get('.vdr-snap-container').element as HTMLElement
    expect(container.style.getPropertyValue('--vdr-guide-color')).toBe('#0f0')

    state.container = { showGuides: false }
    await dragATo(147, 104)
    expect(guides('x')).toEqual([])
    expect(container.style.getPropertyValue('--vdr-guide-color')).toBe('')
  })

  it('tracks elements that move, resize or change from outside', async () => {
    const { a, state, dragATo } = mountContainer()

    state.b = { x: 100, y: 200, w: 80, h: 50 }
    await nextTick()

    await dragATo(128, 30)
    expect(rectOf(a).x).toBe(130) // b's new right edge (180) - a's width
    await release()

    // Resize b with its handle: 100..180 becomes 100..220.
    const b = document.querySelector('.b')!
    pointer(b, 'pointerdown')
    pointer(document, 'pointerup')
    await nextTick()
    pointer(b.querySelector('[data-handle="mr"]')!, 'pointerdown', 0, 0)
    pointer(document, 'pointermove', 40, 0)
    pointer(document, 'pointerup', 40, 0)
    await nextTick()

    pointer(a, 'pointerdown', 0, 0)
    pointer(document, 'pointermove', 38, 0)
    await nextTick()
    expect(rectOf(a).x).toBe(170)
  })

  it('forgets elements that are unmounted', async () => {
    const { a, state, guides, dragATo } = mountContainer({ snapToParent: false })

    state.showB = false
    await nextTick()

    await dragATo(147, 104)
    expect(rectOf(a)).toMatchObject({ x: 147, y: 104 })
    expect(guides('x')).toEqual([])
    expect(guides('y')).toEqual([])
  })

  it('keeps a snapped element inside its parent', async () => {
    const { a, state, dragATo } = mountContainer({ snapToParent: false, guidesX: [-3, 303] })
    state.parent = true
    await nextTick()

    await dragATo(-1, 0)
    expect(rectOf(a).x).toBe(0)

    pointer(document, 'pointermove', 252, 0)
    await nextTick()
    expect(rectOf(a).x).toBe(250)
  })

  it('clears the guides when the dragged element is unmounted', async () => {
    const { wrapper, state, guides } = mountContainer()
    const b = wrapper.get('.b').element

    pointer(b, 'pointerdown', 0, 0)
    pointer(document, 'pointermove', -100, 0)
    await nextTick()
    expect(guides('x').length).toBeGreaterThan(0)

    state.showB = false
    await nextTick()
    expect(wrapper.find('.vdr-snap-container').exists()).toBe(true)
    expect(wrapper.find('.vdr-guide').exists()).toBe(false)
  })
})
