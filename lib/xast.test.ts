import type { XastElement, XastRoot } from './types'
import { detachNodeFromParent, visit, visitSkip } from './xast'

const root = (children: XastElement[]): XastRoot => {
  return { type: 'root', children }
}

const x = (
  name: string,
  attrs: null | Record<string, string> = null,
  children: XastElement[] = [],
): XastElement => {
  return { type: 'element', name, attributes: attrs || {}, children }
}

test('visit enters into nodes', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')])
  const entered: string[] = []
  visit(ast, {
    root: {
      enter: (node) => {
        entered.push(node.type)
      },
    },
    element: {
      enter: (node) => {
        entered.push(`${node.type}:${node.name}`)
      },
    },
  })
  expect(entered).toEqual([
    'root',
    'element:g',
    'element:rect',
    'element:circle',
    'element:ellipse',
  ])
})

test('visit exits from nodes', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')])
  const exited: string[] = []
  visit(ast, {
    root: {
      exit: (node) => {
        exited.push(node.type)
      },
    },
    element: {
      exit: (node) => {
        exited.push(`${node.type}:${node.name}`)
      },
    },
  })
  expect(exited).toEqual([
    'element:rect',
    'element:circle',
    'element:g',
    'element:ellipse',
    'root',
  ])
})

test('visit skips entering children if node is detached', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')])
  const entered: string[] = []
  visit(ast, {
    element: {
      enter: (node, parentNode) => {
        entered.push(node.name)
        if (node.name === 'g') {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  })
  expect(entered).toEqual(['g', 'ellipse'])
  expect(ast).toEqual(root([x('ellipse')]))
})

test('visit skips entering children when symbol is passed', () => {
  const ast = root([x('g', null, [x('rect'), x('circle')]), x('ellipse')])
  /**
   * @type {Array<string>}
   */
  const entered = []
  visit(ast, {
    element: {
      enter: (node) => {
        entered.push(node.name)
        if (node.name === 'g') {
          return visitSkip
        }
      },
    },
  })
  expect(entered).toEqual(['g', 'ellipse'])
  expect(ast).toEqual(
    root([x('g', null, [x('rect'), x('circle')]), x('ellipse')]),
  )
})
