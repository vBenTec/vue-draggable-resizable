<template>
  <div id="app">
    <div>
      x:{{ state.x }}
      <button @click="state.x += 10">+</button>
      <button @click="state.x -= 10">-</button>
    </div>
    <div>
      y:{{ state.y }}
      <button @click="state.y += 10">+</button>
      <button @click="state.y -= 10">-</button>
    </div>
    <div>
      w:{{ state.w }}
      <button @click="state.w += 10">+</button>
      <button @click="state.w -= 10">-</button>
    </div>
    <div>
      h: {{ state.h }}
      <button @click="state.h += 10">+</button>
      <button @click="state.h -= 10">-</button>
    </div>
    <div>active:{{ state.active }}<br /></div>

    <h2>Parent bounds, locked aspect ratio</h2>
    <div class="parent">
      <DraggableResizable
        :initW="40"
        :initH="80"
        v-model:x="state.x"
        v-model:y="state.y"
        v-model:w="state.w"
        v-model:h="state.h"
        v-model:active="state.active"
        :draggable="true"
        :resizable="true"
        :parent="true"
        :disabledX="false"
        :disabledW="false"
        :disabledH="false"
        :disabledY="false"
        :lockAspectRatio="true"
        @activated="print('activated')"
        @deactivated="print('deactivated')"
        @drag-start="print('drag-start', $event)"
        @resize-start="print('resize-start', $event)"
        @dragging="print('dragging', $event)"
        @resizing="print('resizing', $event)"
        @drag-end="print('drag-end', $event)"
        @resize-end="print('resize-end', $event)"
      >
        Example
      </DraggableResizable>
    </div>

    <h2>Snapping container</h2>
    <div class="parent">
      <DraggableContainer>
        <DraggableResizable
          :initW="40"
          :initH="80"
          v-model:x="state.x"
          v-model:y="state.y"
          v-model:w="state.w"
          v-model:h="state.h"
          v-model:active="state.active"
          :draggable="true"
          :resizable="true"
          :parent="true"
          :disabledX="false"
          :disabledW="false"
          :disabledH="false"
          :disabledY="false"
          :lockAspectRatio="true"
          @activated="print('activated')"
          @deactivated="print('deactivated')"
          @drag-start="print('drag-start', $event)"
          @resize-start="print('resize-start', $event)"
          @dragging="print('dragging', $event)"
          @resizing="print('resizing', $event)"
          @drag-end="print('drag-end', $event)"
          @resize-end="print('resize-end', $event)"
        >
          Example
        </DraggableResizable>

        <DraggableResizable
          :initW="40"
          :initH="80"
          :draggable="true"
          :resizable="true"
          :parent="true"
          :disabledX="false"
          :disabledW="false"
          :disabledH="false"
          :disabledY="false"
          :lockAspectRatio="true"
        >
          Example
        </DraggableResizable>

        <DraggableResizable
          :initW="40"
          :initH="80"
          :x="100"
          :draggable="true"
          :resizable="true"
          :parent="true"
          :disabledX="false"
          :disabledW="false"
          :disabledH="false"
          :disabledY="false"
          :lockAspectRatio="true"
        >
          Example
        </DraggableResizable>
      </DraggableContainer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

import { DraggableContainer, DraggableResizable } from '../../src'
import type { DragPayload, ResizePayload } from '../../src'

const state = reactive({
  x: 100,
  y: 100,
  h: 100,
  w: 100,
  active: false,
})

const print = (msg: string, payload?: DragPayload | ResizePayload) => {
  console.log(msg, payload ?? '')
}
</script>

<style scoped>
.parent {
  width: 300px;
  height: 300px;

  /*
    position: absolute;
    top: 100px;
    left: 200px;
  */
  position: relative;
  border: 1px solid #000;
  user-select: none;
}
</style>
