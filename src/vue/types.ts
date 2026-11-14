import type { Point, Rect, ReferenceLineMap, ResizeHandle, Size } from '../core/types'

export interface DraggableResizableProps {
  /** Initial width (px), used when `w` / `v-model:w` is not set. */
  initW?: number
  /** Initial height (px), used when `h` / `v-model:h` is not set. */
  initH?: number
  /** Whether the element can be dragged. @default true */
  draggable?: boolean
  /** Whether the element can be resized. @default true */
  resizable?: boolean
  /** Lock movement on the x-axis. */
  disabledX?: boolean
  /** Lock movement on the y-axis. */
  disabledY?: boolean
  /** Lock the width. */
  disabledW?: boolean
  /** Lock the height. */
  disabledH?: boolean
  /** Minimum width (px). @default 20 */
  minW?: number
  /** Minimum height (px). @default 20 */
  minH?: number
  /** Maximum width (px). @default Infinity */
  maxW?: number
  /** Maximum height (px). @default Infinity */
  maxH?: number
  /** Restrict movement and size to the parent element. */
  parent?: boolean
  /** Resize handles to render. @default all eight handles */
  handles?: readonly ResizeHandle[]
  /** Keep the aspect ratio while resizing. */
  lockAspectRatio?: boolean
  /** Additional class while `draggable` is enabled. @default 'vdr-draggable' */
  classNameDraggable?: string
  /** Additional class while `resizable` is enabled. @default 'vdr-resizable' */
  classNameResizable?: string
  /** Additional class while dragging. @default 'vdr-dragging' */
  classNameDragging?: string
  /** Additional class while resizing. @default 'vdr-resizing' */
  classNameResizing?: string
  /** Additional class while active. @default 'vdr-active' */
  classNameActive?: string
  /** Additional class for each handle; also applied as `<class>-<handle>`. @default 'vdr-handle' */
  classNameHandle?: string
}

export interface DraggableContainerProps {
  /** Turn snapping off. */
  disabled?: boolean
  /** Snap to the edges and the centre of the parent. @default true */
  adsorbParent?: boolean
  /** Custom vertical guides (x coordinates, px). */
  adsorbCols?: readonly number[]
  /** Custom horizontal guides (y coordinates, px). */
  adsorbRows?: readonly number[]
  /** Show the guide lines while dragging. @default true */
  referenceLineVisible?: boolean
  /** Colour of the guide lines. Defaults to `--vdr-reference-line-color`, then `#f00`. */
  referenceLineColor?: string
}

/** Payload of `drag-start`, `dragging` and `drag-end`. */
export type DragPayload = Point

/** Payload of `resize-start`, `resizing` and `resize-end`. */
export type ResizePayload = Rect

export type DraggableResizableEmits = {
  activated: []
  deactivated: []
  'drag-start': [payload: DragPayload]
  dragging: [payload: DragPayload]
  'drag-end': [payload: DragPayload]
  'resize-start': [payload: ResizePayload]
  resizing: [payload: ResizePayload]
  'resize-end': [payload: ResizePayload]
}

type UnionToIntersection<U> = (U extends unknown ? (arg: U) => void : never) extends (
  arg: infer I,
) => void
  ? I
  : never

/** @internal Type of the component's `emit` function, for the composables. */
export type DraggableResizableEmit = UnionToIntersection<
  {
    [K in keyof DraggableResizableEmits]: (event: K, ...args: DraggableResizableEmits[K]) => void
  }[keyof DraggableResizableEmits]
>

/** @internal What a `DraggableContainer` provides to the elements inside it. */
export interface ContainerContext {
  updatePosition: (id: string, rect: Rect) => void
  removePosition: (id: string) => void
  /** Lines the element `id` can snap to, or `null` while snapping is disabled. */
  getReferenceLines: (id: string, parentSize: Size | null) => ReferenceLineMap | null
  setMatchedLines: (lines: ReferenceLineMap | null) => void
}
