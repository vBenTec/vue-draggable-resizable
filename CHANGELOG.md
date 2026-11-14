# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 2.0.0-beta.0 — unreleased

A rewrite in `<script setup>` and TypeScript with working type declarations, a dependency-free
ESM build and a test suite. See [Migrating from 1.x](README.md#migrating-from-1x).

### Breaking

- **ESM only.** The UMD/CommonJS builds are gone.
- **Named exports only.** There is no default export and no `app.use()` plugin; import
  `DraggableResizable` and `DraggableContainer` by name.
- **Styles moved** to `vue3-draggable-resizable/style.css`.
- **Vue ≥ 3.5** is required and is a peer dependency (it is no longer bundled).
- **Pointer events** replace the separate mouse and touch listeners. Only the primary button
  starts a gesture. Code that relied on `@mousedown.stop` / `@touchstart.stop` to shield an area
  from deactivating an element needs `@pointerdown.stop`.
- **Class names are `vdr-` prefixed.** The `className*` defaults changed from `draggable`,
  `resizable`, `dragging`, `resizing`, `active`, `handle` to `vdr-draggable`, … `vdr-handle`.
  The default theme no longer depends on these classes; it uses the `data-active`,
  `data-dragging` and `data-resizing` attributes.
- **`''` is no longer a valid handle**; the type is now `ResizeHandle`.
- **Event payloads are typed** as `{ x, y }` (drag) and `{ x, y, w, h }` (resize). They were
  declared as DOM `Event`s before.
- `DraggableContainer` renders `.vdr-snap-container`, and `referenceLineColor` has no prop
  default any more — the colour falls back to `--vdr-reference-line-color`, then `#f00`.

### Added

- `maxW` and `maxH` props.
- Theming through CSS custom properties (`--vdr-border-color`, `--vdr-border-width`,
  `--vdr-handle-size`, `--vdr-handle-background`, `--vdr-handle-border-color`,
  `--vdr-reference-line-color`).
- `data-active`, `data-dragging`, `data-resizing="<handle>"` and `data-handle="<handle>"`
  attributes for styling and testing.
- Exported types: `DraggableResizableProps`, `DraggableContainerProps`,
  `DraggableResizableEmits`, `DragPayload`, `ResizePayload`, `Rect`, `ResizeHandle`.
- Server-side rendering support (no DOM access during setup).

### Fixed

- The parent's size is observed with a `ResizeObserver` instead of being read once, and is
  measured as the parent's padding box, which is what absolutely positioned children are laid
  out in.
- Snapping can no longer move an element outside its parent.
- A `DraggableContainer` no longer snaps to elements that were unmounted, and follows elements
  that are resized or moved through `v-model`.
- Changing `classNameActive` or `classNameDragging` no longer removes the default styling.
- `lockAspectRatio`, `resizable`, `handles`, `parent` and the `disabled*` props react to changes.

### Changed

- With `lockAspectRatio`, the `tr` and `bl` handles keep the opposite corner in place (they used
  to behave like `br` and `tl`). Top / bottom handles follow the vertical pointer movement.
- Snapping picks the closest guide instead of the last match, and only guides the element is
  actually aligned with are drawn.
- Drag and resize events are emitted synchronously, in order: `*-start`, `*ing`, `*-end`.
