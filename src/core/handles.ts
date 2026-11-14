import type { ResizeHandle } from './types'

export const ALL_HANDLES = [
  'tl',
  'tm',
  'tr',
  'ml',
  'mr',
  'bl',
  'bm',
  'br',
] as const satisfies readonly ResizeHandle[]

const isResizeHandle = (value: unknown): value is ResizeHandle =>
  (ALL_HANDLES as readonly unknown[]).includes(value)

/** Drops unknown and duplicate entries, keeping the given order. */
export const filterHandles = (handles: readonly unknown[] | null | undefined): ResizeHandle[] => [
  ...new Set((handles ?? []).filter(isResizeHandle)),
]
