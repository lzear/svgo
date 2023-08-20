import { detachNodeFromParent } from '../lib/xast'

import type { Plugin } from './plugins-types'

export const name = 'removeMetadata'
export const description = 'removes <metadata>'

/**
 * Remove <metadata>.
 *
 * https://www.w3.org/TR/SVG11/metadata.html
 *
 * @author Kir Belevich
 */
export const fn: Plugin<'removeMetadata'> = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'metadata') {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  }
}
