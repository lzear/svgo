// @ts-nocheck

import {
  attrsGroups,
  inheritableAttrs,
  presentationNonInheritableGroupAttrs,
} from './_collections'
import type { Plugin } from './plugins-types'

export const name = 'removeNonInheritableGroupAttrs'
export const description =
  'removes non-inheritable group’s presentational attributes'

/**
 * Remove non-inheritable group's "presentation" attributes.
 *
 * @author Kir Belevich
 */
export const fn: Plugin<'removeNonInheritableGroupAttrs'> = () => {
  return {
    element: {
      enter: (node) => {
        if (node.name === 'g') {
          for (const name of Object.keys(node.attributes)) {
            if (
              attrsGroups.presentation.includes(name) === true &&
              inheritableAttrs.includes(name) === false &&
              presentationNonInheritableGroupAttrs.includes(name) === false
            ) {
              delete node.attributes[name]
            }
          }
        }
      },
    },
  }
}
