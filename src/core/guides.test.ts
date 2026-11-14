import { describe, expect, it } from 'vitest'

import { collectGuides, getMatchedGuides, snapToGuides } from './guides'

const parentSize = { width: 300, height: 200 }

describe('collectGuides', () => {
  it('returns null when disabled', () => {
    expect(collectGuides({ disabled: true }, parentSize, [])).toBeNull()
  })

  it('collects custom guides, parent guides and the other rects', () => {
    const guides = collectGuides({ snapToParent: true, guidesX: [42], guidesY: [7] }, parentSize, [
      { x: 10, y: 20, w: 40, h: 60 },
    ])

    expect(guides).toEqual({
      x: [42, 0, 150, 300, 10, 30, 50],
      y: [7, 0, 100, 200, 20, 50, 80],
    })
  })

  it('skips parent guides when not requested or unknown', () => {
    expect(collectGuides({}, parentSize, [])).toEqual({ x: [], y: [] })
    expect(collectGuides({ snapToParent: true }, null, [])).toEqual({ x: [], y: [] })
  })

  it('removes duplicates', () => {
    const guides = collectGuides({ guidesX: [0, 0, 150] }, parentSize, [
      { x: 0, y: 0, w: 300, h: 200 },
      { x: 0, y: 0, w: 300, h: 200 },
    ])
    expect(guides).toEqual({ x: [0, 150, 300], y: [0, 100, 200] })
  })
})

describe('snapToGuides', () => {
  const guides = { x: [100], y: [100] }

  it('snaps the start, centre or end of the rect', () => {
    expect(snapToGuides({ x: 97, y: 104, w: 40, h: 20 }, guides)).toEqual({ x: 100, y: 100 })
    expect(snapToGuides({ x: 83, y: 88, w: 40, h: 20 }, guides)).toEqual({ x: 80, y: 90 })
    expect(snapToGuides({ x: 58, y: 84, w: 40, h: 20 }, guides)).toEqual({ x: 60, y: 80 })
  })

  it('leaves the rect alone outside the threshold', () => {
    expect(snapToGuides({ x: 106, y: 60, w: 40, h: 20 }, guides)).toEqual({ x: 106, y: 60 })
  })

  it('prefers the closest guide', () => {
    expect(snapToGuides({ x: 97, y: 0, w: 40, h: 20 }, { x: [93, 98], y: [] }).x).toBe(98)
  })

  it('skips axes that are switched off', () => {
    const rect = { x: 97, y: 104, w: 40, h: 20 }
    expect(snapToGuides(rect, guides, { x: false })).toEqual({ x: 97, y: 100 })
    expect(snapToGuides(rect, guides, { y: false })).toEqual({ x: 100, y: 104 })
  })
})

describe('getMatchedGuides', () => {
  it('returns the guides the rect is aligned with', () => {
    const guides = { x: [100, 120, 140, 141], y: [5, 110] }
    expect(getMatchedGuides({ x: 100, y: 100, w: 40, h: 20 }, guides)).toEqual({
      x: [100, 120, 140],
      y: [110],
    })
  })
})
