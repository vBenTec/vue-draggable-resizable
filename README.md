<p align="center"><img src="docs/logo.png" alt="vue3-draggable-resizable"></p>

<h1 align="center">vue3-draggable-resizable</h1>

<div align="center">

[![npm version](https://img.shields.io/npm/v/vue3-draggable-resizable.svg?style=flat-square)](https://www.npmjs.com/package/vue3-draggable-resizable)
[![license](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=flat-square)](LICENSE)
[![vue](https://img.shields.io/badge/vue-%E2%89%A5%203.5-brightgreen.svg?style=flat-square)](https://vuejs.org)

</div>

> Draggable and resizable component for Vue 3, with snapping, alignment guides and first-class
> TypeScript support.

- Drag and resize with mouse, touch and pen (Pointer Events)
- Restrict movement and size to the parent element
- Min / max sizes, locked axes, locked aspect ratio
- Snapping to other elements, the parent and custom guides, drawn live while dragging
- Fully typed props, events and `v-model`s
- No runtime dependencies, ESM, SSR-safe, themeable with CSS custom properties

> **Upgrading from 1.x?** See [Migrating from 1.x](#migrating-from-1x).

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [DraggableResizable](#draggableresizable)
  - [Props](#props)
  - [Models](#models)
  - [Events](#events)
- [DraggableContainer](#draggablecontainer) (snapping)
- [Styling](#styling)
- [TypeScript](#typescript)
- [SSR / Nuxt](#ssr--nuxt)
- [Migrating from 1.x](#migrating-from-1x)
- [Development](#development)

## Installation

```bash
npm install vue3-draggable-resizable
```

Requires Vue 3.5 or newer. The package is ESM only.

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { DraggableResizable, type DragPayload } from 'vue3-draggable-resizable'

import 'vue3-draggable-resizable/style.css'

const x = ref(100)
const y = ref(100)
const w = ref(120)
const h = ref(80)
const active = ref(false)

const onDragEnd = ({ x, y }: DragPayload) => console.log('dropped at', x, y)
</script>

<template>
  <div class="parent">
    <DraggableResizable
      v-model:x="x"
      v-model:y="y"
      v-model:w="w"
      v-model:h="h"
      v-model:active="active"
      parent
      @drag-end="onDragEnd"
    >
      Drag me
    </DraggableResizable>
  </div>
</template>

<style>
.parent {
  position: relative;
  width: 400px;
  height: 300px;
}
</style>
```

The element is absolutely positioned, so its parent needs `position: relative` (or any other
non-static position). Import the stylesheet once, anywhere in your app.

## DraggableResizable

### Props

| Prop                 | Type                      | Default         | Description                                                      |
| -------------------- | ------------------------- | --------------- | ---------------------------------------------------------------- |
| `initW`              | `number`                  | `0`             | Initial width in px, used while `w` is not set.                  |
| `initH`              | `number`                  | `0`             | Initial height in px, used while `h` is not set.                 |
| `draggable`          | `boolean`                 | `true`          | Whether the element can be dragged.                              |
| `resizable`          | `boolean`                 | `true`          | Whether the element can be resized.                              |
| `parent`             | `boolean`                 | `false`         | Restrict movement and size to the parent element.                |
| `minW`               | `number`                  | `20`            | Minimum width in px.                                             |
| `minH`               | `number`                  | `20`            | Minimum height in px.                                            |
| `maxW`               | `number`                  | —               | Maximum width in px.                                             |
| `maxH`               | `number`                  | —               | Maximum height in px.                                            |
| `disabledX`          | `boolean`                 | `false`         | Lock movement on the x-axis.                                     |
| `disabledY`          | `boolean`                 | `false`         | Lock movement on the y-axis.                                     |
| `disabledW`          | `boolean`                 | `false`         | Lock the width.                                                  |
| `disabledH`          | `boolean`                 | `false`         | Lock the height.                                                 |
| `lockAspectRatio`    | `boolean`                 | `false`         | Keep the aspect ratio while resizing.                            |
| `handles`            | `readonly ResizeHandle[]` | all eight       | Handles to render: `tl` `tm` `tr` `ml` `mr` `bl` `bm` `br`.      |
| `classNameDraggable` | `string`                  | `vdr-draggable` | Extra class while `draggable` is on.                             |
| `classNameResizable` | `string`                  | `vdr-resizable` | Extra class while `resizable` is on.                             |
| `classNameDragging`  | `string`                  | `vdr-dragging`  | Extra class while dragging.                                      |
| `classNameResizing`  | `string`                  | `vdr-resizing`  | Extra class while resizing.                                      |
| `classNameActive`    | `string`                  | `vdr-active`    | Extra class while active.                                        |
| `classNameHandle`    | `string`                  | `vdr-handle`    | Extra class on every handle, also applied as `<class>-<handle>`. |

All props are reactive.

Handle names combine a row (`t`op, `m`iddle, `b`ottom) with a column (`l`eft, `m`iddle,
`r`ight):

```
tl ─ tm ─ tr
│          │
ml        mr
│          │
bl ─ bm ─ br
```

With `lockAspectRatio`, corner handles keep the opposite corner in place. Edge handles have to
change both dimensions, so `tm` and `ml` resize from the top-left corner and `bm` and `mr` from
the bottom-right one. The lock is ignored while `disabledW` or `disabledH` is set.

### Models

| Model            | Type      | Default | Description                      |
| ---------------- | --------- | ------- | -------------------------------- |
| `v-model:x`      | `number`  | `0`     | Left offset in px.               |
| `v-model:y`      | `number`  | `0`     | Top offset in px.                |
| `v-model:w`      | `number`  | `initW` | Width in px.                     |
| `v-model:h`      | `number`  | `initH` | Height in px.                    |
| `v-model:active` | `boolean` | `false` | Whether the element is selected. |

Every model is optional. Without `v-model` the component keeps the value itself, so
`<DraggableResizable :x="50" :init-w="100" :init-h="100" />` starts at `x = 50` and can still be
moved.

An element becomes active when it is pressed, and inactive when the pointer goes down anywhere
outside it. Handles are only shown while it is active. To keep an element active while the user
interacts with something else (a toolbar, say), stop the event there:
`<div @pointerdown.stop>`.

### Events

| Event          | Payload         | When                                          |
| -------------- | --------------- | --------------------------------------------- |
| `activated`    | —               | The element became active.                    |
| `deactivated`  | —               | The element became inactive.                  |
| `drag-start`   | `DragPayload`   | The pointer went down on a draggable element. |
| `dragging`     | `DragPayload`   | On every move while dragging.                 |
| `drag-end`     | `DragPayload`   | The pointer was released or cancelled.        |
| `resize-start` | `ResizePayload` | The pointer went down on a handle.            |
| `resizing`     | `ResizePayload` | On every move while resizing.                 |
| `resize-end`   | `ResizePayload` | The pointer was released or cancelled.        |

```ts
type DragPayload = { x: number; y: number }
type ResizePayload = { x: number; y: number; w: number; h: number }
```

### Slots

The default slot is the element's content.

## DraggableContainer

Wrap elements in a `DraggableContainer` to make them snap to each other, to the parent's edges
and centre, and to custom guides. Matching guides are drawn while dragging.

```vue
<script setup lang="ts">
import { DraggableContainer, DraggableResizable } from 'vue3-draggable-resizable'

import 'vue3-draggable-resizable/style.css'
</script>

<template>
  <div class="parent">
    <DraggableContainer :guides-x="[100, 200]">
      <DraggableResizable :init-w="80" :init-h="80">One</DraggableResizable>
      <DraggableResizable :init-w="80" :init-h="80" :x="150">Two</DraggableResizable>
    </DraggableContainer>
  </div>
</template>
```

The container fills its parent (`width: 100%; height: 100%; position: relative`). Elements snap
when one of their edges or their centre comes within 5px of a guide.

| Prop           | Type                | Default | Description                                        |
| -------------- | ------------------- | ------- | -------------------------------------------------- |
| `disabled`     | `boolean`           | `false` | Turn snapping off.                                 |
| `snapToParent` | `boolean`           | `true`  | Snap to the edges and the centre of the container. |
| `guidesX`      | `readonly number[]` | `[]`    | Custom vertical guides (x coordinates in px).      |
| `guidesY`      | `readonly number[]` | `[]`    | Custom horizontal guides (y coordinates in px).    |
| `showGuides`   | `boolean`           | `true`  | Draw the matching guides while dragging.           |
| `guideColor`   | `string`            | `#f00`  | Guide colour. Sets `--vdr-guide-color`.            |

## Styling

The stylesheet is small and unscoped. Everything is prefixed with `vdr-`:

| Selector                              | Element                                     |
| ------------------------------------- | ------------------------------------------- |
| `.vdr-container`                      | The draggable element.                      |
| `.vdr-container[data-active]`         | … while active.                             |
| `.vdr-container[data-dragging]`       | … while dragging.                           |
| `.vdr-container[data-resizing]`       | … while resizing (the value is the handle). |
| `.vdr-handle`, `.vdr-handle-<handle>` | A resize handle.                            |
| `.vdr-snap-container`                 | The `DraggableContainer` root.              |
| `.vdr-guide`, `.vdr-guide-x`, `-y`    | A guide (`-x` vertical, `-y` horizontal).   |

Theme it with CSS custom properties, set on the element or any ancestor:

| Property                    | Default   |
| --------------------------- | --------- |
| `--vdr-border-color`        | `#000`    |
| `--vdr-border-width`        | `1px`     |
| `--vdr-handle-size`         | `7px`     |
| `--vdr-handle-background`   | `#f0f0f0` |
| `--vdr-handle-border-color` | `#333`    |
| `--vdr-guide-color`         | `#f00`    |

```css
.editor {
  --vdr-border-color: #4f46e5;
  --vdr-handle-size: 10px;
  --vdr-handle-background: #fff;
  --vdr-handle-border-color: #4f46e5;
}
```

The `className*` props add classes on top of these, which is handy with utility CSS:

```vue
<DraggableResizable class-name-active="ring-2" class-name-handle="my-handle" />
<!-- handles render as: class="vdr-handle vdr-handle-tl my-handle my-handle-tl" -->
```

The component sets `touch-action: none` on itself so that touch gestures drag the element
instead of scrolling the page.

## TypeScript

Types ship with the package. Props, models and event payloads are checked in templates (with
Vue - Official / `vue-tsc`).

```ts
import type {
  DraggableResizableProps,
  DraggableContainerProps,
  DraggableResizableEmits,
  DragPayload, // { x, y }
  ResizePayload, // { x, y, w, h }
  Rect, // { x, y, w, h }
  ResizeHandle, // 'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br'
} from 'vue3-draggable-resizable'

const handles: ResizeHandle[] = ['tl', 'br']
```

## SSR / Nuxt

The components render on the server and attach their listeners after mounting, so no
`<ClientOnly>` wrapper is needed. Positions come from props, so the server output already has
the right layout.

## Migrating from 1.x

**1. Imports.** There is no default export and no plugin any more.

```diff
- import Vue3DraggableResizable, { DraggableContainer } from 'vue3-draggable-resizable'
- import 'vue3-draggable-resizable/dist/Vue3DraggableResizable.css'
- app.use(Vue3DraggableResizable)
+ import { DraggableResizable, DraggableContainer } from 'vue3-draggable-resizable'
+ import 'vue3-draggable-resizable/style.css'
```

Rename `<Vue3DraggableResizable>` to `<DraggableResizable>` in templates, or register it under
the old name yourself: `app.component('Vue3DraggableResizable', DraggableResizable)`.

**2. Environment.** Vue ≥ 3.5 and an ESM-aware toolchain (Vite, Nuxt, webpack 5, …). There is no
UMD or CommonJS build.

**3. Class names.** The defaults of the `className*` props are now prefixed: `draggable` →
`vdr-draggable`, `resizable` → `vdr-resizable`, `dragging` → `vdr-dragging`, `resizing` →
`vdr-resizing`, `active` → `vdr-active`, `handle` → `vdr-handle`. If your CSS targets the old
names, either update the selectors (prefer the `data-*` attributes from [Styling](#styling)) or
pass the old names explicitly, for example `class-name-active="active"`.

**4. Pointer events.** Mouse and touch listeners were replaced by Pointer Events. If you used
`@mousedown.stop` / `@touchstart.stop` to keep an element active while clicking elsewhere, use
`@pointerdown.stop`. Only the primary mouse button starts a drag or resize.

**5. Types.** Event handlers receive `{ x, y }` or `{ x, y, w, h }` and are typed that way. The
handle type is `ResizeHandle` and no longer includes `''`.

**6. Snapping props.** The `DraggableContainer` props use one name, _guide_: `adsorbParent` →
`snapToParent`, `adsorbCols` → `guidesX`, `adsorbRows` → `guidesY`, `referenceLineVisible` →
`showGuides`, `referenceLineColor` → `guideColor`. The guides render as `.vdr-guide-x` /
`.vdr-guide-y` (were `.vdr-reference-line-col` / `-row`), coloured by `--vdr-guide-color`.

**7. Behaviour changes.** These may be visible if you depended on the old behaviour:

- With `lockAspectRatio`, the `tr` and `bl` handles keep the opposite corner in place.
- The parent's size is its padding box and follows the parent resizing.
- `DraggableContainer` snaps to the closest guide, never pushes an element out of its parent,
  and only draws guides the element is actually aligned with. `guideColor` can also be set with
  `--vdr-guide-color`.

The full list is in the [changelog](CHANGELOG.md).

## Development

```bash
pnpm install
pnpm dev-vue     # playground
pnpm test        # unit, component and type tests
pnpm typecheck
pnpm lint && pnpm fmt:check
pnpm build && pnpm check:pkg
```

`src/core` holds the framework-agnostic geometry (limits, resizing, snapping); `src/vue` holds
the components and composables built on it. Only `src/index.ts` is public API.

## License

[MIT](LICENSE)
