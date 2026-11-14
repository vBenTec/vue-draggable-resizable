import type { ConstraintOptions, Rect, ResizeHandle, Size, SizeLimits } from './types'

type VerticalEdge = 't' | 'b' | null
type HorizontalEdge = 'l' | 'r' | null

export interface ResizeEdges {
  /** Edge that follows the pointer vertically, `null` if the height does not change. */
  vertical: VerticalEdge
  /** Edge that follows the pointer horizontally, `null` if the width does not change. */
  horizontal: HorizontalEdge
}

export interface ResizeInput {
  handle: ResizeHandle
  /** Rect at the moment the resize started. */
  start: Rect
  /** Pointer movement since the resize started. */
  deltaX: number
  deltaY: number
  options: ConstraintOptions
  /** Size of the parent, required for `options.parent`. */
  parentSize: Size | null
}

/** Edge moved by the first / second letter of a handle; `m`iddle moves neither. */
const VERTICAL_EDGES: Partial<Record<string, VerticalEdge>> = { t: 't', b: 'b' }
const HORIZONTAL_EDGES: Partial<Record<string, HorizontalEdge>> = { l: 'l', r: 'r' }

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max))

/**
 * Limits for a rect of the given size: min/max size from the options and, with `parent`, the
 * range of positions that keep it inside the parent.
 */
export const calculateSizeLimits = (
  options: ConstraintOptions,
  parentSize: Size | null,
  currentWidth: number,
  currentHeight: number,
): SizeLimits => {
  const bounds = options.parent ? parentSize : null
  const maxW = options.maxW ?? Infinity
  const maxH = options.maxH ?? Infinity

  return {
    minWidth: options.minW ?? 0,
    minHeight: options.minH ?? 0,
    maxWidth: bounds ? Math.min(bounds.width, maxW) : maxW,
    maxHeight: bounds ? Math.min(bounds.height, maxH) : maxH,
    minLeft: bounds ? 0 : -Infinity,
    minTop: bounds ? 0 : -Infinity,
    maxLeft: bounds ? bounds.width - currentWidth : Infinity,
    maxTop: bounds ? bounds.height - currentHeight : Infinity,
  }
}

/** Clamps a rect to the limits. Disabled axes are returned untouched. */
export const constrainPosition = (
  rect: Rect,
  limits: SizeLimits,
  options: ConstraintOptions,
): Rect => ({
  x: options.disabledX ? rect.x : clamp(rect.x, limits.minLeft, limits.maxLeft),
  y: options.disabledY ? rect.y : clamp(rect.y, limits.minTop, limits.maxTop),
  w: options.disabledW ? rect.w : clamp(rect.w, limits.minWidth, limits.maxWidth),
  h: options.disabledH ? rect.h : clamp(rect.h, limits.minHeight, limits.maxHeight),
})

/** Moves a rect by a pointer delta, honouring `disabledX` / `disabledY`. */
export const moveRect = (
  start: Rect,
  deltaX: number,
  deltaY: number,
  options: ConstraintOptions,
): Rect => ({
  ...start,
  x: options.disabledX ? start.x : start.x + deltaX,
  y: options.disabledY ? start.y : start.y + deltaY,
})

/** The aspect ratio (h / w) to preserve, or `null` if it cannot or should not be preserved. */
const getLockedAspectRatio = (start: Rect, options: ConstraintOptions): number | null => {
  if (!options.lockAspectRatio || options.disabledW || options.disabledH) return null
  const ratio = start.h / start.w
  return Number.isFinite(ratio) && ratio > 0 ? ratio : null
}

/**
 * Which edges a handle moves. With a locked aspect ratio both dimensions always change, so an
 * edge handle also moves the adjacent edge: `tm` / `ml` behave like `tl`, `bm` / `mr` like `br`.
 */
export const getResizeEdges = (
  handle: ResizeHandle,
  options: ConstraintOptions,
  lockAspectRatio = false,
): ResizeEdges => {
  let vertical = VERTICAL_EDGES[handle.charAt(0)] ?? null
  let horizontal = HORIZONTAL_EDGES[handle.charAt(1)] ?? null

  if (lockAspectRatio) {
    if (handle === 'tm' || handle === 'ml') {
      vertical = 't'
      horizontal = 'l'
    } else if (handle === 'bm' || handle === 'mr') {
      vertical = 'b'
      horizontal = 'r'
    }
  }

  return {
    vertical: options.disabledH ? null : vertical,
    horizontal: options.disabledW ? null : horizontal,
  }
}

/**
 * Size limits while resizing: the edges opposite to the moving ones stay where they are, so with
 * `parent` the available room depends on which edges move. With a locked aspect ratio the limits
 * are tightened so that both dimensions reach them at the same time.
 */
const calculateResizeLimits = (
  edges: ResizeEdges,
  start: Rect,
  options: ConstraintOptions,
  parentSize: Size | null,
  aspectRatio: number | null,
) => {
  const limits = calculateSizeLimits(options, parentSize, start.w, start.h)
  let { minWidth, minHeight, maxWidth, maxHeight } = limits

  if (options.parent && parentSize) {
    const roomX = edges.horizontal === 'l' ? start.x + start.w : parentSize.width - start.x
    const roomY = edges.vertical === 't' ? start.y + start.h : parentSize.height - start.y
    maxWidth = Math.min(maxWidth, roomX)
    maxHeight = Math.min(maxHeight, roomY)
  }

  if (aspectRatio !== null) {
    if (minHeight / minWidth > aspectRatio) {
      minWidth = minHeight / aspectRatio
    } else {
      minHeight = minWidth * aspectRatio
    }

    if (maxHeight / maxWidth < aspectRatio) {
      maxWidth = maxHeight / aspectRatio
    } else {
      maxHeight = maxWidth * aspectRatio
    }
  }

  return { minWidth, minHeight, maxWidth, maxHeight }
}

/** How much each dimension grows for a pointer delta. */
const calculateGrowth = (
  handle: ResizeHandle,
  edges: ResizeEdges,
  deltaX: number,
  deltaY: number,
  aspectRatio: number | null,
) => {
  const growX = edges.horizontal === 'r' ? deltaX : edges.horizontal === 'l' ? -deltaX : 0
  const growY = edges.vertical === 'b' ? deltaY : edges.vertical === 't' ? -deltaY : 0

  if (aspectRatio === null) return { growX, growY }

  // Top / bottom handles are driven by the vertical movement, all others by the horizontal one.
  return handle[1] === 'm'
    ? { growX: growY / aspectRatio, growY }
    : { growX, growY: growX * aspectRatio }
}

/** The rect that results from dragging `handle` by the given pointer delta. */
export const resizeRect = ({
  handle,
  start,
  deltaX,
  deltaY,
  options,
  parentSize,
}: ResizeInput): Rect => {
  const aspectRatio = getLockedAspectRatio(start, options)
  const edges = getResizeEdges(handle, options, aspectRatio !== null)
  const limits = calculateResizeLimits(edges, start, options, parentSize, aspectRatio)
  const { growX, growY } = calculateGrowth(handle, edges, deltaX, deltaY, aspectRatio)

  const w = edges.horizontal ? clamp(start.w + growX, limits.minWidth, limits.maxWidth) : start.w
  const h = edges.vertical ? clamp(start.h + growY, limits.minHeight, limits.maxHeight) : start.h

  return {
    // The edge opposite to the moving one stays in place.
    x: edges.horizontal === 'l' ? start.x + start.w - w : start.x,
    y: edges.vertical === 't' ? start.y + start.h - h : start.y,
    w,
    h,
  }
}
