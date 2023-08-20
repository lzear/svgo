import { detachNodeFromParent } from '../lib/xast'

import type { Plugin } from './plugins-types'

export const name = 'removeScriptElement'
export const description = 'removes <script> elements (disabled by default)'

/**
 * Remove <script>.
 *
 * https://www.w3.org/TR/SVG11/script.html
 *
 * @author Patrick Klingemann
 */
export const fn: Plugin<'removeScriptElement'> = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'script') {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  }
}
