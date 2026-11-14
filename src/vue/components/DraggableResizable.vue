<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, useId, useTemplateRef, watch } from 'vue'

import { ALL_HANDLES, filterHandles } from '../../core/handles'
import type { ConstraintOptions, Rect, ResizeHandle } from '../../core/types'
import { useContainer } from '../composables/useContainer'
import { useGesture } from '../composables/useGesture'
import type { DraggableResizableEmits, DraggableResizableProps } from '../types'

const {
  draggable = true,
  resizable = true,
  disabledX,
  disabledY,
  disabledW,
  disabledH,
  minW = 20,
  minH = 20,
  maxW,
  maxH,
  parent,
  handles = ALL_HANDLES,
  lockAspectRatio,
  classNameDraggable = 'vdr-draggable',
  classNameResizable = 'vdr-resizable',
  classNameDragging = 'vdr-dragging',
  classNameResizing = 'vdr-resizing',
  classNameActive = 'vdr-active',
  classNameHandle = 'vdr-handle',
} = defineProps<DraggableResizableProps>()

const emit = defineEmits<DraggableResizableEmits>()

defineSlots<{
  default?: () => unknown
}>()

const x = defineModel<number>('x', { default: 0 })
const y = defineModel<number>('y', { default: 0 })
// Falls back to `initW` / `initH` while the size is not controlled from outside.
const w = defineModel<number>('w', {
  default: (raw: Record<string, unknown>) => (typeof raw.initW === 'number' ? raw.initW : 0),
})
const h = defineModel<number>('h', {
  default: (raw: Record<string, unknown>) => (typeof raw.initH === 'number' ? raw.initH : 0),
})
const active = defineModel<boolean>('active', { default: false })

// The four models as one value. Writing it only emits updates for the models that changed.
const rect = computed<Rect>({
  get: () => ({ x: x.value, y: y.value, w: w.value, h: h.value }),
  set: (next) => {
    x.value = next.x
    y.value = next.y
    w.value = next.w
    h.value = next.h
  },
})

const id = useId()
const root = useTemplateRef<HTMLDivElement>('root')
const container = useContainer()

const constraints = computed<ConstraintOptions>(() => ({
  disabledX,
  disabledY,
  disabledW,
  disabledH,
  minW,
  minH,
  maxW,
  maxH,
  parent,
  lockAspectRatio,
}))

const { gesture, startDrag, startResize } = useGesture({
  id,
  root,
  rect,
  constraints,
  draggable: () => draggable,
  resizable: () => resizable,
  container,
  emit,
})

const dragging = computed(() => gesture.value?.kind === 'drag')
const resizingHandle = computed(() =>
  gesture.value?.kind === 'resize' ? gesture.value.handle : null,
)

const onPointerDown = (event: PointerEvent) => {
  active.value = true
  startDrag(event)
}

const onOutsidePointerDown = (event: PointerEvent) => {
  if (active.value && !root.value?.contains(event.target as Node | null)) {
    active.value = false
  }
}

watch(active, (isActive) => {
  if (isActive) emit('activated')
  else emit('deactivated')
})

onMounted(() => document.addEventListener('pointerdown', onOutsidePointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutsidePointerDown))

if (container) {
  const syncPosition = () => container.updatePosition(id, rect.value)

  onMounted(syncPosition)
  watch(rect, syncPosition)
  onBeforeUnmount(() => container.removePosition(id))
}

const visibleHandles = computed(() => (resizable ? filterHandles(handles) : []))

const style = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: `${w.value}px`,
  height: `${h.value}px`,
  // Without this the browser claims touch gestures for scrolling and cancels the pointer.
  touchAction: draggable || resizable ? 'none' : undefined,
}))

const stateClasses = computed(() => ({
  [classNameDraggable]: draggable,
  [classNameResizable]: resizable,
  [classNameDragging]: dragging.value,
  [classNameResizing]: resizingHandle.value !== null,
  [classNameActive]: active.value,
}))

const handleClasses = (handle: ResizeHandle) => [
  ...new Set([
    'vdr-handle',
    `vdr-handle-${handle}`,
    classNameHandle,
    `${classNameHandle}-${handle}`,
  ]),
]
</script>

<template>
  <div
    ref="root"
    class="vdr-container"
    :class="stateClasses"
    :style="style"
    :data-active="active || undefined"
    :data-dragging="dragging || undefined"
    :data-resizing="resizingHandle ?? undefined"
    @click="active = true"
    @pointerdown="onPointerDown"
    @dragstart.prevent
  >
    <slot />
    <div
      v-for="handle in visibleHandles"
      v-show="active"
      :key="handle"
      :class="handleClasses(handle)"
      :data-handle="handle"
      @pointerdown.stop="startResize($event, handle)"
    />
  </div>
</template>

<style>
.vdr-container {
  position: absolute;
  box-sizing: border-box;
  border: var(--vdr-border-width, 1px) solid transparent;
}

.vdr-container[data-active] {
  border-color: var(--vdr-border-color, #000);
  border-style: dashed;
}

.vdr-container[data-dragging] {
  border-style: solid;
}

.vdr-container[data-dragging],
.vdr-container[data-resizing] {
  user-select: none;
}

.vdr-handle {
  --_vdr-handle-size: var(--vdr-handle-size, 7px);
  /* Centres the handle on the container's border. */
  --_vdr-handle-offset: calc((var(--_vdr-handle-size) + var(--vdr-border-width, 1px)) / -2);

  position: absolute;
  box-sizing: border-box;
  width: var(--_vdr-handle-size);
  height: var(--_vdr-handle-size);
  background: var(--vdr-handle-background, #f0f0f0);
  border: 1px solid var(--vdr-handle-border-color, #333);
}

.vdr-handle-tl,
.vdr-handle-tm,
.vdr-handle-tr {
  top: var(--_vdr-handle-offset);
}

.vdr-handle-bl,
.vdr-handle-bm,
.vdr-handle-br {
  bottom: var(--_vdr-handle-offset);
}

.vdr-handle-tl,
.vdr-handle-ml,
.vdr-handle-bl {
  left: var(--_vdr-handle-offset);
}

.vdr-handle-tr,
.vdr-handle-mr,
.vdr-handle-br {
  right: var(--_vdr-handle-offset);
}

.vdr-handle-tm,
.vdr-handle-bm {
  left: 50%;
  margin-left: calc(var(--_vdr-handle-size) / -2);
}

.vdr-handle-ml,
.vdr-handle-mr {
  top: 50%;
  margin-top: calc(var(--_vdr-handle-size) / -2);
}

.vdr-handle-tl,
.vdr-handle-br {
  cursor: nwse-resize;
}

.vdr-handle-tr,
.vdr-handle-bl {
  cursor: nesw-resize;
}

.vdr-handle-tm,
.vdr-handle-bm {
  cursor: ns-resize;
}

.vdr-handle-ml,
.vdr-handle-mr {
  cursor: ew-resize;
}
</style>
