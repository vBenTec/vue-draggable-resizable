import { describe, expectTypeOf, it } from 'vitest'

import {
  DraggableContainer,
  DraggableResizable,
  type DraggableContainerProps,
  type DraggableResizableEmits,
  type DraggableResizableProps,
  type DragPayload,
  type Rect,
  type ResizeHandle,
  type ResizePayload,
} from './index'

type Props = InstanceType<typeof DraggableResizable>['$props']
type ContainerProps = InstanceType<typeof DraggableContainer>['$props']

describe('ResizeHandle', () => {
  it('only accepts the eight handles', () => {
    expectTypeOf<ResizeHandle>().toEqualTypeOf<
      'tl' | 'tm' | 'tr' | 'ml' | 'mr' | 'bl' | 'bm' | 'br'
    >()
    expectTypeOf<''>().not.toExtend<ResizeHandle>()
    expectTypeOf<'top'>().not.toExtend<ResizeHandle>()
  })
})

describe('DraggableResizable', () => {
  it('types its props', () => {
    expectTypeOf<Props['handles']>().toEqualTypeOf<readonly ResizeHandle[] | undefined>()
    expectTypeOf<Props['parent']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<Props['minW']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Props['maxW']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Props['maxH']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Props['classNameHandle']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<Props>().toExtend<DraggableResizableProps>()
  })

  it('types its models', () => {
    expectTypeOf<Props['x']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Props['y']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Props['w']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Props['h']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<Props['active']>().toEqualTypeOf<boolean | undefined>()
    expectTypeOf<NonNullable<Props['onUpdate:x']>>().parameters.toEqualTypeOf<[value: number]>()
    expectTypeOf<NonNullable<Props['onUpdate:active']>>().parameters.toEqualTypeOf<
      [value: boolean]
    >()
  })

  it('types its event payloads', () => {
    expectTypeOf<DragPayload>().toEqualTypeOf<{ x: number; y: number }>()
    expectTypeOf<ResizePayload>().toEqualTypeOf<Rect>()
    expectTypeOf<Rect>().toMatchObjectType<{ x: number; y: number; w: number; h: number }>()

    expectTypeOf<NonNullable<Props['onActivated']>>().parameters.toEqualTypeOf<[]>()
    expectTypeOf<NonNullable<Props['onDeactivated']>>().parameters.toEqualTypeOf<[]>()
    expectTypeOf<NonNullable<Props['onDrag-start']>>().parameters.toEqualTypeOf<
      [payload: DragPayload]
    >()
    expectTypeOf<NonNullable<Props['onDragging']>>().parameters.toEqualTypeOf<
      [payload: DragPayload]
    >()
    expectTypeOf<NonNullable<Props['onDrag-end']>>().parameters.toEqualTypeOf<
      [payload: DragPayload]
    >()
    expectTypeOf<NonNullable<Props['onResize-start']>>().parameters.toEqualTypeOf<
      [payload: ResizePayload]
    >()
    expectTypeOf<NonNullable<Props['onResizing']>>().parameters.toEqualTypeOf<
      [payload: ResizePayload]
    >()
    expectTypeOf<NonNullable<Props['onResize-end']>>().parameters.toEqualTypeOf<
      [payload: ResizePayload]
    >()

    expectTypeOf<DraggableResizableEmits['resize-end']>().toEqualTypeOf<[payload: ResizePayload]>()
  })

  it('rejects wrong prop types', () => {
    expectTypeOf<{ handles: ['tl', ''] }>().not.toExtend<Props>()
    expectTypeOf<{ handles: string[] }>().not.toExtend<Props>()
    expectTypeOf<{ parent: 'yes' }>().not.toExtend<Props>()
    expectTypeOf<{ x: '10' }>().not.toExtend<Props>()
    expectTypeOf<{ 'onDrag-end': (event: MouseEvent) => void }>().not.toExtend<Props>()
  })
})

describe('DraggableContainer', () => {
  it('types its props', () => {
    expectTypeOf<ContainerProps['adsorbCols']>().toEqualTypeOf<readonly number[] | undefined>()
    expectTypeOf<ContainerProps['referenceLineColor']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<ContainerProps>().toExtend<DraggableContainerProps>()
    expectTypeOf<{ adsorbRows: string[] }>().not.toExtend<ContainerProps>()
  })
})
