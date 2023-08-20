import type { XastElement } from '../lib/types'

import type { Plugin } from './plugins-types'

export const name = 'reusePaths'
export const description =
  'Finds <path> elements with the same d, fill, and ' +
  'stroke, and converts them to <use> elements ' +
  'referencing a single <path> def.'

/**
 * Finds <path> elements with the same d, fill, and stroke, and converts them to
 * <use> elements referencing a single <path> def.
 *
 * @author Jacob Howcroft
 */
export const fn: Plugin<'reusePaths'> = () => {
  const paths = new Map<string, Array<XastElement>>()

  return {
    element: {
      enter: (node) => {
        if (node.name === 'path' && node.attributes.d != null) {
          const d = node.attributes.d
          const fill = node.attributes.fill || ''
          const stroke = node.attributes.stroke || ''
          const key = d + ';s:' + stroke + ';f:' + fill
          let list = paths.get(key)
          if (list == null) {
            list = []
            paths.set(key, list)
          }
          list.push(node)
        }
      },

      exit: (node, parentNode) => {
        if (node.name === 'svg' && parentNode.type === 'root') {
          const defsTag: XastElement = {
            type: 'element',
            name: 'defs',
            attributes: {},
            children: [],
          }
          // TODO remove legacy parentNode in v4
          Object.defineProperty(defsTag, 'parentNode', {
            writable: true,
            value: node,
          })
          let index = 0
          for (const list of paths.values()) {
            if (list.length > 1) {
              // add reusable path to defs
              const reusablePath: XastElement = {
                type: 'element',
                name: 'path',
                attributes: { ...list[0].attributes },
                children: [],
              }
              delete reusablePath.attributes.transform
              let id
              if (reusablePath.attributes.id == null) {
                id = 'reuse-' + index
                index += 1
                reusablePath.attributes.id = id
              } else {
                id = reusablePath.attributes.id
                delete list[0].attributes.id
              }
              // TODO remove legacy parentNode in v4
              Object.defineProperty(reusablePath, 'parentNode', {
                writable: true,
                value: defsTag,
              })
              defsTag.children.push(reusablePath)
              // convert paths to <use>
              for (const pathNode of list) {
                pathNode.name = 'use'
                pathNode.attributes['xlink:href'] = '#' + id
                delete pathNode.attributes.d
                delete pathNode.attributes.stroke
                delete pathNode.attributes.fill
              }
            }
          }
          if (defsTag.children.length > 0) {
            if (node.attributes['xmlns:xlink'] == null) {
              node.attributes['xmlns:xlink'] = 'http://www.w3.org/1999/xlink'
            }
            node.children.unshift(defsTag)
          }
        }
      },
    },
  }
}
