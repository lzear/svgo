import { detachNodeFromParent } from '../lib/xast'

import type { Plugin } from './plugins-types'

export const name = 'removeDesc'
export const description = 'removes <desc>'

const standardDescs = /^(Created with|Created using)/

/**
 * Removes <desc>.
 * Removes only standard editors content or empty elements 'cause it can be used for accessibility.
 * Enable parameter 'removeAny' to remove any description.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/desc
 *
 * @author Daniel Wabyick
 */
export const fn: Plugin<'removeDesc'> = (root, params) => {
  const { removeAny = true } = params
  return {
    element: {
      enter: (node, parentNode) => {
        if (
          node.name === 'desc' &&
          (removeAny ||
            node.children.length === 0 ||
            (node.children[0].type === 'text' &&
              standardDescs.test(node.children[0].value)))
        ) {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  }
}
