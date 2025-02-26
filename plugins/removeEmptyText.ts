import { detachNodeFromParent } from '../lib/xast'

import type { Plugin } from './plugins-types'

export const name = 'removeEmptyText'
export const description = 'removes empty <text> elements'

/**
 * Remove empty Text elements.
 *
 * @see https://www.w3.org/TR/SVG11/text.html
 *
 * @example
 * Remove empty text element:
 * <text/>
 *
 * Remove empty tspan element:
 * <tspan/>
 *
 * Remove tref with empty xlink:href attribute:
 * <tref xlink:href=""/>
 *
 * @author Kir Belevich
 */
export const fn: Plugin<'removeEmptyText'> = (root, params) => {
  const { text = true, tspan = true, tref = true } = params
  return {
    element: {
      enter: (node, parentNode) => {
        // Remove empty text element
        if (text && node.name === 'text' && node.children.length === 0) {
          detachNodeFromParent(node, parentNode)
        }
        // Remove empty tspan element
        if (tspan && node.name === 'tspan' && node.children.length === 0) {
          detachNodeFromParent(node, parentNode)
        }
        // Remove tref with empty xlink:href attribute
        if (
          tref &&
          node.name === 'tref' &&
          node.attributes['xlink:href'] == null
        ) {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  }
}
