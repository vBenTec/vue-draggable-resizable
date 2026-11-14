import { describe, expect, it } from 'vitest'

import {
  dragRect,
  getResizeEdges,
  resizeRect,
  type DragInput,
  type ResizeInput,
} from './positioning'
import type { Guides, Rect } from './types'

const parentSize = { width: 300, height: 200 }
const start: Rect = { x: 100, y: 50, w: 100, h: 50 }

const drag = (input: Partial<DragInput>) =>
  dragRect({ start, deltaX: 0, deltaY: 0, options: {}, parentSize: null, guides: null, ...input })

const resize = (input: Partial<ResizeInput> & Pick<ResizeInput, 'handle'>) =>
  resizeRect({ start, deltaX: 0, deltaY: 0, options: {}, parentSize: null, ...input })

describe('dragRect', () => {
  // Vertical guides at 0 / 150 / 300, horizontal ones at 0 / 100 / 200.
  const guides: Guides = { x: [0, 150, 300], y: [0, 100, 200] }

  it.each([
    ['moves by the delta', { deltaX: 10, deltaY: -20 }, { x: 110, y: 30 }],
    [
      'ignores disabledX',
      { deltaX: 10, deltaY: -20, options: { disabledX: true } },
      { x: 100, y: 30 },
    ],
    [
      'ignores disabledY',
      { deltaX: 10, deltaY: -20, options: { disabledY: true } },
      { x: 110, y: 50 },
    ],
    ['is unbounded without parent', { deltaX: -500, deltaY: 500, parentSize }, { x: -400, y: 550 }],
    [
      'stays inside the parent',
      { deltaX: -500, deltaY: 500, options: { parent: true }, parentSize },
      { x: 0, y: 150 },
    ],
    [
      'stays inside the parent on the far side',
      { deltaX: 500, deltaY: -500, options: { parent: true }, parentSize },
      { x: 200, y: 0 },
    ],
    [
      'pins an element larger than the parent to its top left corner',
      {
        start: { x: 0, y: 0, w: 400, h: 300 },
        deltaX: 30,
        deltaY: 30,
        options: { parent: true },
        parentSize,
      },
      { x: 0, y: 0 },
    ],
    [
      'ignores the parent while its size is unknown',
      { deltaX: 500, deltaY: 500, options: { parent: true } },
      { x: 600, y: 550 },
    ],
    [
      'does not clamp a disabled axis',
      {
        start: { x: -10, y: 50, w: 100, h: 50 },
        options: { parent: true, disabledX: true },
        parentSize,
      },
      { x: -10, y: 50 },
    ],
  ] satisfies [string, Partial<DragInput>, { x: number; y: number }][])(
    '%s',
    (_, input, expected) => {
      expect(drag(input)).toEqual({ ...expected, matchedGuides: null })
    },
  )

  it('snaps the closest line of the rect to a guide and reports the matched guides', () => {
    // Moved to 103 / 97: the centre line 153 snaps to 150, the top edge 97 to 100.
    expect(drag({ deltaX: 3, deltaY: 47, guides })).toEqual({
      x: 100,
      y: 100,
      matchedGuides: { x: [150], y: [100] },
    })
  })

  it('reports no matched guides when nothing is aligned', () => {
    expect(drag({ deltaX: 20, deltaY: 10, guides })).toEqual({
      x: 120,
      y: 60,
      matchedGuides: { x: [], y: [] },
    })
  })

  it('does not snap disabled axes', () => {
    // The centre line 153 would snap to 150 and move the element to 100.
    const shifted = { ...start, x: 103 }
    const options = { disabledX: true }
    expect(drag({ start: shifted, deltaY: 47, guides, options })).toMatchObject({ x: 103, y: 100 })
  })

  it('never snaps out of the parent', () => {
    const outside: Guides = { x: [-3, 303], y: [] }
    const options = { parent: true }
    expect(drag({ deltaX: -99, options, parentSize, guides: outside })).toMatchObject({ x: 0 })
    expect(drag({ deltaX: 99, options, parentSize, guides: outside })).toMatchObject({ x: 200 })
  })
})

describe('getResizeEdges', () => {
  it('maps handles to the edges they move', () => {
    expect(getResizeEdges('tl', {})).toEqual({ vertical: 't', horizontal: 'l' })
    expect(getResizeEdges('tm', {})).toEqual({ vertical: 't', horizontal: null })
    expect(getResizeEdges('mr', {})).toEqual({ vertical: null, horizontal: 'r' })
    expect(getResizeEdges('bl', {})).toEqual({ vertical: 'b', horizontal: 'l' })
  })

  it('turns edge handles into corner handles for a locked aspect ratio', () => {
    expect(getResizeEdges('tm', {}, true)).toEqual({ vertical: 't', horizontal: 'l' })
    expect(getResizeEdges('ml', {}, true)).toEqual({ vertical: 't', horizontal: 'l' })
    expect(getResizeEdges('bm', {}, true)).toEqual({ vertical: 'b', horizontal: 'r' })
    expect(getResizeEdges('mr', {}, true)).toEqual({ vertical: 'b', horizontal: 'r' })
    expect(getResizeEdges('tr', {}, true)).toEqual({ vertical: 't', horizontal: 'r' })
  })

  it('drops edges of disabled dimensions', () => {
    expect(getResizeEdges('br', { disabledW: true })).toEqual({ vertical: 'b', horizontal: null })
    expect(getResizeEdges('br', { disabledH: true })).toEqual({ vertical: null, horizontal: 'r' })
  })
})

describe('resizeRect', () => {
  it.each([
    ['tl', { x: 110, y: 70, w: 90, h: 30 }],
    ['tm', { x: 100, y: 70, w: 100, h: 30 }],
    ['tr', { x: 100, y: 70, w: 110, h: 30 }],
    ['ml', { x: 110, y: 50, w: 90, h: 50 }],
    ['mr', { x: 100, y: 50, w: 110, h: 50 }],
    ['bl', { x: 110, y: 50, w: 90, h: 70 }],
    ['bm', { x: 100, y: 50, w: 100, h: 70 }],
    ['br', { x: 100, y: 50, w: 110, h: 70 }],
  ] as const)('%s moves only its own edges', (handle, expected) => {
    expect(resize({ handle, deltaX: 10, deltaY: 20 })).toEqual(expected)
  })

  it('respects min sizes and keeps the opposite edge in place', () => {
    const options = { minW: 40, minH: 20 }
    expect(resize({ handle: 'tl', deltaX: 500, deltaY: 500, options })).toEqual({
      x: 160,
      y: 80,
      w: 40,
      h: 20,
    })
  })

  it('respects max sizes', () => {
    const options = { maxW: 120, maxH: 60 }
    expect(resize({ handle: 'br', deltaX: 500, deltaY: 500, options })).toMatchObject({
      w: 120,
      h: 60,
    })
    expect(resize({ handle: 'tl', deltaX: -500, deltaY: -500, options })).toEqual({
      x: 80,
      y: 40,
      w: 120,
      h: 60,
    })
  })

  it('stays inside the parent', () => {
    const options = { parent: true }
    expect(resize({ handle: 'br', deltaX: 500, deltaY: 500, options, parentSize })).toEqual({
      x: 100,
      y: 50,
      w: 200,
      h: 150,
    })
    expect(resize({ handle: 'tl', deltaX: -500, deltaY: -500, options, parentSize })).toEqual({
      x: 0,
      y: 0,
      w: 200,
      h: 100,
    })
  })

  it('does not change disabled dimensions', () => {
    expect(
      resize({ handle: 'tl', deltaX: -10, deltaY: -10, options: { disabledW: true } }),
    ).toEqual({ x: 100, y: 40, w: 100, h: 60 })
    expect(
      resize({ handle: 'tl', deltaX: -10, deltaY: -10, options: { disabledH: true } }),
    ).toEqual({ x: 90, y: 50, w: 110, h: 50 })
  })

  describe('with a locked aspect ratio', () => {
    const options = { lockAspectRatio: true }

    it.each([
      // Corner handles keep the opposite corner in place.
      ['br', 20, 0, { x: 100, y: 50, w: 120, h: 60 }],
      ['tl', -20, 0, { x: 80, y: 40, w: 120, h: 60 }],
      ['tr', 20, 0, { x: 100, y: 40, w: 120, h: 60 }],
      ['bl', -20, 0, { x: 80, y: 50, w: 120, h: 60 }],
      // Left / right handles are driven by the horizontal movement.
      ['mr', 20, 99, { x: 100, y: 50, w: 120, h: 60 }],
      ['ml', -20, 99, { x: 80, y: 40, w: 120, h: 60 }],
      // Top / bottom handles are driven by the vertical movement.
      ['bm', 99, 10, { x: 100, y: 50, w: 120, h: 60 }],
      ['tm', 99, -10, { x: 80, y: 40, w: 120, h: 60 }],
    ] as const)('%s keeps the ratio', (handle, deltaX, deltaY, expected) => {
      expect(resize({ handle, deltaX, deltaY, options })).toEqual(expected)
    })

    it('reaches min sizes in both dimensions at once', () => {
      const result = resize({
        handle: 'br',
        deltaX: -500,
        options: { ...options, minW: 20, minH: 20 },
      })
      expect(result).toMatchObject({ w: 40, h: 20 })
    })

    it('reaches max sizes in both dimensions at once', () => {
      const result = resize({
        handle: 'br',
        deltaX: 500,
        options: { ...options, maxW: 500, maxH: 100 },
      })
      expect(result).toMatchObject({ w: 200, h: 100 })
    })

    it('stays inside the parent without breaking the ratio', () => {
      const result = resize({
        handle: 'br',
        deltaX: 500,
        options: { ...options, parent: true },
        parentSize,
      })
      expect(result).toEqual({ x: 100, y: 50, w: 200, h: 100 })
    })

    it('falls back to free resizing when a dimension is disabled or empty', () => {
      expect(
        resize({ handle: 'br', deltaX: 20, deltaY: 5, options: { ...options, disabledH: true } }),
      ).toMatchObject({ w: 120, h: 50 })
      expect(
        resize({ handle: 'br', deltaX: 20, deltaY: 5, options, start: { ...start, h: 0 } }),
      ).toMatchObject({ w: 120, h: 5 })
    })
  })
})
