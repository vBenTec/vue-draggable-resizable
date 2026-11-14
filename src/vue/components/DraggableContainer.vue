<script setup lang="ts">
import { computed } from 'vue'

import { provideContainer } from '../composables/useContainer'
import type { DraggableContainerProps } from '../types'

const props = withDefaults(defineProps<DraggableContainerProps>(), {
  adsorbParent: true,
  referenceLineVisible: true,
  adsorbCols: () => [],
  adsorbRows: () => [],
})

defineSlots<{
  default?: () => unknown
}>()

const { matchedLines } = provideContainer(() => ({
  disabled: props.disabled,
  adsorbParent: props.adsorbParent,
  adsorbCols: props.adsorbCols,
  adsorbRows: props.adsorbRows,
}))

const style = computed(() =>
  props.referenceLineColor ? { '--vdr-reference-line-color': props.referenceLineColor } : undefined,
)
</script>

<template>
  <div class="vdr-snap-container" :style="style">
    <slot />
    <template v-if="referenceLineVisible && matchedLines">
      <div
        v-for="value in matchedLines.col"
        :key="`col-${value}`"
        class="vdr-reference-line vdr-reference-line-col"
        :style="{ left: `${value}px` }"
      />
      <div
        v-for="value in matchedLines.row"
        :key="`row-${value}`"
        class="vdr-reference-line vdr-reference-line-row"
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

.vdr-reference-line {
  position: absolute;
  pointer-events: none;
}

.vdr-reference-line-col {
  top: 0;
  width: 0;
  height: 100%;
  border-left: 1px dashed var(--vdr-reference-line-color, #f00);
}

.vdr-reference-line-row {
  left: 0;
  width: 100%;
  height: 0;
  border-top: 1px dashed var(--vdr-reference-line-color, #f00);
}
</style>
