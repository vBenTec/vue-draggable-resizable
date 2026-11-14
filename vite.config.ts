import { fileURLToPath } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'style',
    },
    // Consumers minify; readable output is easier to debug and to patch.
    minify: false,
    rolldownOptions: {
      external: ['vue'],
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.ts'],
    typecheck: {
      enabled: true,
      checker: 'vue-tsc',
      include: ['src/**/*.test-d.ts'],
    },
  },
})
