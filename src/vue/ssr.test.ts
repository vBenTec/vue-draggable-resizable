import { expect, it } from 'vitest'
// @vitest-environment node
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'

import { DraggableContainer, DraggableResizable } from '../index'

it('renders on the server without touching the DOM', async () => {
  expect(typeof document).toBe('undefined')

  const app = createSSRApp({
    render: () =>
      h(DraggableContainer, () => [
        h(DraggableResizable, { x: 10, y: 20, initW: 30, initH: 40, parent: true, active: true }),
      ]),
  })

  const html = await renderToString(app)

  expect(html).toContain('vdr-snap-container')
  expect(html).toContain('left:10px;top:20px;width:30px;height:40px')
  expect(html).toContain('vdr-handle-br')
})
