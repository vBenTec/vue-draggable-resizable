import { describe, expect, it } from 'vitest'

import { getMatchedLines, getReferenceLineMap, snapToReferenceLines } from './reference-lines'

const parentSize = { width: 300, height: 200 }

describe('getReferenceLineMap', () => {
  it('returns null when disabled', () => {
    expect(getReferenceLineMap({ disabled: true }, parentSize, [])).toBeNull()
  })

  it('collects custom guides, parent lines and the other rects', () => {
    const map = getReferenceLineMap(
      { adsorbParent: true, adsorbCols: [42], adsorbRows: [7] },
      parentSize,
      [{ x: 10, y: 20, w: 40, h: 60 }],
    )

    expect(map).toEqual({
      col: [42, 0, 150, 300, 10, 30, 50],
      row: [7, 0, 100, 200, 20, 50, 80],
    })
  })

  it('skips parent lines when not requested or unknown', () => {
    expect(getReferenceLineMap({}, parentSize, [])).toEqual({ row: [], col: [] })
    expect(getReferenceLineMap({ adsorbParent: true }, null, [])).toEqual({ row: [], col: [] })
  })

  it('removes duplicates', () => {
    const map = getReferenceLineMap({ adsorbCols: [0, 0, 150] }, parentSize, [
      { x: 0, y: 0, w: 300, h: 200 },
      { x: 0, y: 0, w: 300, h: 200 },
    ])
    expect(map).toEqual({ col: [0, 150, 300], row: [0, 100, 200] })
  })
})

describe('snapToReferenceLines', () => {
  const map = { col: [100], row: [100] }

  it('snaps the start, centre or end of the rect', () => {
    expect(snapToReferenceLines({ x: 97, y: 104, w: 40, h: 20 }, map)).toEqual({ x: 100, y: 100 })
    expect(snapToReferenceLines({ x: 83, y: 88, w: 40, h: 20 }, map)).toEqual({ x: 80, y: 90 })
    expect(snapToReferenceLines({ x: 58, y: 84, w: 40, h: 20 }, map)).toEqual({ x: 60, y: 80 })
  })

  it('leaves the rect alone outside the threshold', () => {
    expect(snapToReferenceLines({ x: 106, y: 60, w: 40, h: 20 }, map)).toEqual({ x: 106, y: 60 })
  })

  it('prefers the closest line', () => {
    expect(snapToReferenceLines({ x: 97, y: 0, w: 40, h: 20 }, { col: [93, 98], row: [] }).x).toBe(
      98,
    )
  })

  it('skips axes that are switched off', () => {
    const rect = { x: 97, y: 104, w: 40, h: 20 }
    expect(snapToReferenceLines(rect, map, { x: false })).toEqual({ x: 97, y: 100 })
    expect(snapToReferenceLines(rect, map, { y: false })).toEqual({ x: 100, y: 104 })
  })
})

describe('getMatchedLines', () => {
  it('returns the lines the rect is aligned with', () => {
    const map = { col: [100, 120, 140, 141], row: [5, 110] }
    expect(getMatchedLines({ x: 100, y: 100, w: 40, h: 20 }, map)).toEqual({
      col: [100, 120, 140],
      row: [110],
    })
  })
})
