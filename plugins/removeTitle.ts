import { detachNodeFromParent } from '../lib/xast'

import type { Plugin } from './plugins-types'

export const name = 'removeTitle'
export const description = 'removes <title>'

/**
 * Remove <title>.
 *
 * https://developer.mozilla.org/en-US/docs/Web/SVG/Element/title
 *
 * @author Igor Kalashnikov
 */
export const fn: Plugin<'removeTitle'> = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'title') {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  }
}
