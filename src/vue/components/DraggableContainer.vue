<script setup lang="ts">
import { computed } from 'vue'

import { provideContainer } from '../composables/useContainer'
import type { DraggableContainerProps } from '../types'

const {
  disabled,
  snapToParent = true,
  guidesX = [],
  guidesY = [],
  showGuides = true,
  guideColor,
} = defineProps<DraggableContainerProps>()

defineSlots<{
  default?: () => unknown
}>()

const { matchedGuides } = provideContainer(() => ({ disabled, snapToParent, guidesX, guidesY }))

const style = computed(() => (guideColor ? { '--vdr-guide-color': guideColor } : undefined))
</script>

<template>
  <div class="vdr-snap-container" :style="style">
    <slot />
    <template v-if="showGuides && matchedGuides">
      <div
        v-for="value in matchedGuides.x"
        :key="`x-${value}`"
        class="vdr-guide vdr-guide-x"
        :style="{ left: `${value}px` }"
      />
      <div
        v-for="value in matchedGuides.y"
        :key="`y-${value}`"
        class="vdr-guide vdr-guide-y"
        :style="{ top: `${value}px` }"
      />
    </template>
  </div>
</template>

<style>
.vdr-snap-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.vdr-guide {
  position: absolute;
  pointer-events: none;
}

/* Vertical line at an x coordinate. */
.vdr-guide-x {
  top: 0;
  width: 0;
  height: 100%;
  border-left: 1px dashed var(--vdr-guide-color, #f00);
}

/* Horizontal line at a y coordinate. */
.vdr-guide-y {
  left: 0;
  width: 100%;
  height: 0;
  border-top: 1px dashed var(--vdr-guide-color, #f00);
}
</style>
