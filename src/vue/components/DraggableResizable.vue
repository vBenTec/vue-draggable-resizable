<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'

import { ALL_HANDLES, filterHandles } from '../../core/handles'
import type { ConstraintOptions, ResizeHandle } from '../../core/types'
import { useContainer } from '../composables/useContainer'
import { useDrag } from '../composables/useDrag'
import { useParentSize } from '../composables/useParentSize'
import { useResize } from '../composables/useResize'
import type { DraggableResizableEmits, DraggableResizableProps } from '../types'

const props = withDefaults(defineProps<DraggableResizableProps>(), {
  draggable: true,
  resizable: true,
  minW: 20,
  minH: 20,
  handles: () => [...ALL_HANDLES],
  classNameDraggable: 'vdr-draggable',
  classNameResizable: 'vdr-resizable',
  classNameDragging: 'vdr-dragging',
  classNameResizing: 'vdr-resizing',
  classNameActive: 'vdr-active',
  classNameHandle: 'vdr-handle',
})

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

const id = useId()
const root = useTemplateRef<HTMLDivElement>('root')
const container = useContainer()

const dragging = ref(false)
const resizingHandle = ref<ResizeHandle | null>(null)
const resizing = computed(() => resizingHandle.value !== null)

const constraints = computed<ConstraintOptions>(() => ({
  disabledX: props.disabledX,
  disabledY: props.disabledY,
  disabledW: props.disabledW,
  disabledH: props.disabledH,
  minW: props.minW,
  minH: props.minH,
  maxW: props.maxW,
  maxH: props.maxH,
  parent: props.parent,
  lockAspectRatio: props.lockAspectRatio,
}))

// The parent's size is needed for `parent` bounds and for snapping to the parent's edges.
const { parentSize, refresh: refreshParentSize } = useParentSize(
  root,
  () => props.parent || container !== null,
)

const drag = useDrag({
  id,
  x,
  y,
  w,
  h,
  dragging,
  enabled: () => props.draggable,
  constraints,
  parentSize,
  container,
  emit,
})

const resize = useResize({
  x,
  y,
  w,
  h,
  resizingHandle,
  enabled: () => props.resizable,
  constraints,
  parentSize,
  emit,
})

const onPointerDown = (event: PointerEvent) => {
  active.value = true
  if (resizing.value) return
  refreshParentSize()
  drag.onPointerDown(event)
}

const onHandlePointerDown = (event: PointerEvent, handle: ResizeHandle) => {
  if (dragging.value) return
  refreshParentSize()
  resize.onPointerDown(event, handle)
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
  const syncPosition = () =>
    container.updatePosition(id, { x: x.value, y: y.value, w: w.value, h: h.value })

  onMounted(syncPosition)
  watch([x, y, w, h], syncPosition)
  onBeforeUnmount(() => container.removePosition(id))
}

const visibleHandles = computed(() => (props.resizable ? filterHandles(props.handles) : []))

const style = computed(() => ({
  left: `${x.value}px`,
  top: `${y.value}px`,
  width: `${w.value}px`,
  height: `${h.value}px`,
  // Without this the browser claims touch gestures for scrolling and cancels the pointer.
  touchAction: props.draggable || props.resizable ? 'none' : undefined,
}))

const stateClasses = computed(() => ({
  [props.classNameDraggable]: props.draggable,
  [props.classNameResizable]: props.resizable,
  [props.classNameDragging]: dragging.value,
  [props.classNameResizing]: resizing.value,
  [props.classNameActive]: active.value,
}))

const handleClasses = (handle: ResizeHandle) => [
  ...new Set([
    'vdr-handle',
    `vdr-handle-${handle}`,
    props.classNameHandle,
    `${props.classNameHandle}-${handle}`,
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
      @pointerdown.stop="onHandlePointerDown($event, handle)"
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
