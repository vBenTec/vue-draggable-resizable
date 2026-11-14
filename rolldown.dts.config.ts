import { defineConfig } from 'rolldown'
import { dts } from 'rolldown-plugin-dts'

// Bundles the declarations into a single dist/index.d.ts, so they resolve under every
// `moduleResolution` and nothing internal leaks into the published types.
export default defineConfig({
  input: 'src/index.ts',
  external: ['vue'],
  plugins: [dts({ dtsOnly: true, tsconfig: 'tsconfig.build.json', tsc: { vue: true } })],
  output: { dir: 'dist', format: 'es' },
})
