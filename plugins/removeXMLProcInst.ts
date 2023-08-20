import { detachNodeFromParent } from '../lib/xast'

import type { Plugin } from './plugins-types'

export const name = 'removeXMLProcInst'
export const description = 'removes XML processing instructions'

/**
 * Remove XML Processing Instruction.
 *
 * @example
 * <?xml version="1.0" encoding="utf-8"?>
 *
 * @author Kir Belevich
 */
export const fn: Plugin<'removeXMLProcInst'> = () => {
  return {
    instruction: {
      enter: (node, parentNode) => {
        if (node.name === 'xml') {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  }
}
