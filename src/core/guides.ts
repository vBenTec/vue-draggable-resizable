import type { Guides, Point, Rect, Size, SnapOptions } from './types'

/** Distance (px) within which an element snaps to a guide. */
export const SNAP_THRESHOLD = 5

/** Tolerance for treating two coordinates as aligned (guards against float noise). */
const ALIGN_EPSILON = 0.01

/** Start, centre and end of a span. Order matters: it is the snapping priority. */
const spanLines = (start: number, length: number) => [start, start + length / 2, start + length]

/**
 * Collects every coordinate an element may snap to: custom guides, the parent's edges and centre,
 * and the edges and centres of the other elements.
 */
export const collectGuides = (
  options: SnapOptions,
  parentSize: Size | null,
  rects: Iterable<Rect>,
): Guides | null => {
  if (options.disabled) return null

  const x = new Set<number>(options.guidesX)
  const y = new Set<number>(options.guidesY)

  if (options.snapToParent && parentSize) {
    for (const value of spanLines(0, parentSize.width)) x.add(value)
    for (const value of spanLines(0, parentSize.height)) y.add(value)
  }

  for (const rect of rects) {
    for (const value of spanLines(rect.x, rect.w)) x.add(value)
    for (const value of spanLines(rect.y, rect.h)) y.add(value)
  }

  return { x: [...x], y: [...y] }
}

/** Snapped start of a span, or `null` if none of its lines is close enough to a guide. */
const snapSpan = (start: number, length: number, guides: readonly number[]): number | null => {
  let best: { start: number; distance: number } | null = null

  for (const [index, line] of spanLines(start, length).entries()) {
    for (const guide of guides) {
      const distance = Math.abs(line - guide)
      if (distance <= SNAP_THRESHOLD && (!best || distance < best.distance)) {
        best = { start: guide - (index * length) / 2, distance }
      }
    }
  }

  return best ? best.start : null
}

/**
 * Snaps a rect's position to the closest guide per axis. Axes set to `false` in `axes` are left
 * alone.
 */
export const snapToGuides = (
  rect: Rect,
  guides: Guides,
  axes: { x?: boolean; y?: boolean } = {},
): Point => ({
  x: axes.x === false ? rect.x : (snapSpan(rect.x, rect.w, guides.x) ?? rect.x),
  y: axes.y === false ? rect.y : (snapSpan(rect.y, rect.h, guides.y) ?? rect.y),
})

const alignedGuides = (start: number, length: number, guides: readonly number[]) => {
  const lines = spanLines(start, length)
  return guides.filter((guide) => lines.some((line) => Math.abs(line - guide) <= ALIGN_EPSILON))
}

/** The guides a rect is currently aligned with. */
export const getMatchedGuides = (rect: Rect, guides: Guides): Guides => ({
  x: alignedGuides(rect.x, rect.w, guides.x),
  y: alignedGuides(rect.y, rect.h, guides.y),
})
