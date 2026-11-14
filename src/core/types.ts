/** Identifier of a resize handle: `t`op / `m`iddle / `b`ottom + `l`eft / `m`iddle / `r`ight. */
export type ResizeHandle = 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

/** Position and size of an element, in px relative to its offset parent. */
export interface Rect extends Point {
  w: number
  h: number
}

/** Everything that restricts how an element may be moved or resized. */
export interface ConstraintOptions {
  disabledX?: boolean
  disabledY?: boolean
  disabledW?: boolean
  disabledH?: boolean
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  /** Keep the element inside its parent. */
  parent?: boolean
  lockAspectRatio?: boolean
}

export interface SizeLimits {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  minLeft: number
  minTop: number
  maxLeft: number
  maxTop: number
}

export interface SnapOptions {
  disabled?: boolean
  /** Snap to the edges and the centre of the parent. */
  adsorbParent?: boolean
  /** Custom vertical guides (x coordinates). */
  adsorbCols?: readonly number[]
  /** Custom horizontal guides (y coordinates). */
  adsorbRows?: readonly number[]
}

/** Coordinates that an element can snap to. `row` holds y values, `col` holds x values. */
export interface ReferenceLineMap {
  row: number[]
  col: number[]
}
