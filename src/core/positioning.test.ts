import { describe, expect, it } from 'vitest'

import {
  calculateSizeLimits,
  constrainPosition,
  getResizeEdges,
  moveRect,
  resizeRect,
  type ResizeInput,
} from './positioning'
import type { Rect } from './types'

const parentSize = { width: 300, height: 200 }
const start: Rect = { x: 100, y: 50, w: 100, h: 50 }

const resize = (input: Partial<ResizeInput> & Pick<ResizeInput, 'handle'>) =>
  resizeRect({ start, deltaX: 0, deltaY: 0, options: {}, parentSize: null, ...input })

describe('calculateSizeLimits', () => {
  it('is unbounded without parent and max sizes', () => {
    expect(calculateSizeLimits({}, parentSize, 100, 50)).toEqual({
      minWidth: 0,
      minHeight: 0,
      maxWidth: Infinity,
      maxHeight: Infinity,
      minLeft: -Infinity,
      minTop: -Infinity,
      maxLeft: Infinity,
      maxTop: Infinity,
    })
  })

  it('uses min / max sizes from the options', () => {
    const limits = calculateSizeLimits({ minW: 10, minH: 20, maxW: 30, maxH: 40 }, null, 0, 0)
    expect(limits).toMatchObject({ minWidth: 10, minHeight: 20, maxWidth: 30, maxHeight: 40 })
  })

  it('keeps the rect inside the parent', () => {
    const limits = calculateSizeLimits({ parent: true, maxW: 500 }, parentSize, 100, 50)
    expect(limits).toMatchObject({
      maxWidth: 300,
      maxHeight: 200,
      minLeft: 0,
      minTop: 0,
      maxLeft: 200,
      maxTop: 150,
    })
  })

  it('ignores the parent while its size is unknown', () => {
    expect(calculateSizeLimits({ parent: true }, null, 100, 50).maxLeft).toBe(Infinity)
  })
})

describe('constrainPosition', () => {
  const limits = calculateSizeLimits({ parent: true, minW: 20, minH: 20 }, parentSize, 100, 50)

  it('clamps position and size', () => {
    expect(constrainPosition({ x: -10, y: 500, w: 5, h: 999 }, limits, {})).toEqual({
      x: 0,
      y: 150,
      w: 20,
      h: 200,
    })
  })

  it('leaves disabled axes untouched', () => {
    const options = { disabledX: true, disabledY: true, disabledW: true, disabledH: true }
    const rect = { x: -10, y: 500, w: 5, h: 999 }
    expect(constrainPosition(rect, limits, options)).toEqual(rect)
  })
})

describe('moveRect', () => {
  it('moves by the delta', () => {
    expect(moveRect(start, 10, -20, {})).toEqual({ x: 110, y: 30, w: 100, h: 50 })
  })

  it('honours disabled axes', () => {
    expect(moveRect(start, 10, -20, { disabledX: true })).toMatchObject({ x: 100, y: 30 })
    expect(moveRect(start, 10, -20, { disabledY: true })).toMatchObject({ x: 110, y: 50 })
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
