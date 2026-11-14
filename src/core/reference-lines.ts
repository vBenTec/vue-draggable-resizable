import type { Point, Rect, ReferenceLineMap, Size, SnapOptions } from './types'

/** Distance (px) within which an element snaps to a reference line. */
export const SNAP_THRESHOLD = 5

/** Tolerance for treating two coordinates as aligned (guards against float noise). */
const ALIGN_EPSILON = 0.01

/** Start, centre and end of a span. Order matters: it is the snapping priority. */
const spanLines = (start: number, length: number) => [start, start + length / 2, start + length]

/**
 * Collects every coordinate an element may snap to: custom guides, the parent's edges and centre,
 * and the edges and centres of the other elements.
 */
export const getReferenceLineMap = (
  options: SnapOptions,
  parentSize: Size | null,
  rects: Iterable<Rect>,
): ReferenceLineMap | null => {
  if (options.disabled) return null

  const row = new Set<number>(options.adsorbRows)
  const col = new Set<number>(options.adsorbCols)

  if (options.adsorbParent && parentSize) {
    for (const value of spanLines(0, parentSize.height)) row.add(value)
    for (const value of spanLines(0, parentSize.width)) col.add(value)
  }

  for (const { x, y, w, h } of rects) {
    for (const value of spanLines(y, h)) row.add(value)
    for (const value of spanLines(x, w)) col.add(value)
  }

  return { row: [...row], col: [...col] }
}

/** Snapped start of a span, or `null` if none of its lines is close enough to a reference line. */
const snapSpan = (start: number, length: number, references: readonly number[]): number | null => {
  let best: { start: number; distance: number } | null = null

  for (const [index, line] of spanLines(start, length).entries()) {
    for (const reference of references) {
      const distance = Math.abs(line - reference)
      if (distance <= SNAP_THRESHOLD && (!best || distance < best.distance)) {
        best = { start: reference - (index * length) / 2, distance }
      }
    }
  }

  return best ? best.start : null
}

/**
 * Snaps a rect's position to the closest reference line per axis. Axes set to `false` in `axes`
 * are left alone.
 */
export const snapToReferenceLines = (
  rect: Rect,
  referenceLineMap: ReferenceLineMap,
  axes: { x?: boolean; y?: boolean } = {},
): Point => ({
  x: axes.x === false ? rect.x : (snapSpan(rect.x, rect.w, referenceLineMap.col) ?? rect.x),
  y: axes.y === false ? rect.y : (snapSpan(rect.y, rect.h, referenceLineMap.row) ?? rect.y),
})

const alignedLines = (start: number, length: number, references: readonly number[]) => {
  const lines = spanLines(start, length)
  return references.filter((reference) =>
    lines.some((line) => Math.abs(line - reference) <= ALIGN_EPSILON),
  )
}

/** The reference lines a rect is currently aligned with. */
export const getMatchedLines = (
  rect: Rect,
  referenceLineMap: ReferenceLineMap,
): ReferenceLineMap => ({
  row: alignedLines(rect.y, rect.h, referenceLineMap.row),
  col: alignedLines(rect.x, rect.w, referenceLineMap.col),
})
