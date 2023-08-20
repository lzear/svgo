// @ts-nocheck
import { Plugin } from './plugins-types'
import { pathElems, referencesProps } from './_collections'

export const name = 'moveGroupAttrsToElems'
export const description = 'moves some group attributes to the content elements'

const pathElemsWithGroupsAndText = new Set([...pathElems, 'g', 'text'])

/**
 * Move group attrs to the content elements.
 *
 * @example
 * <g transform="scale(2)">
 *     <path transform="rotate(45)" d="M0,0 L10,20"/>
 *     <path transform="translate(10, 20)" d="M0,10 L20,30"/>
 * </g>
 *                          ⬇
 * <g>
 *     <path transform="scale(2) rotate(45)" d="M0,0 L10,20"/>
 *     <path transform="scale(2) translate(10, 20)" d="M0,10 L20,30"/>
 * </g>
 *
 * @author Kir Belevich
 */
export const fn: Plugin<'moveGroupAttrsToElems'> = () => {
  return {
    element: {
      enter: (node) => {
        // move group transform attr to content's pathElems
        if (
          node.name === 'g' &&
          node.children.length > 0 &&
          node.attributes.transform != null &&
          Object.entries(node.attributes).some(
            ([name, value]) =>
              referencesProps.includes(name) && value.includes('url('),
          ) === false &&
          node.children.every(
            (child) =>
              child.type === 'element' &&
              pathElemsWithGroupsAndText.has(child.name) &&
              child.attributes.id == null,
          )
        ) {
          for (const child of node.children) {
            const value = node.attributes.transform
            if (child.type === 'element') {
              child.attributes.transform =
                child.attributes.transform == null
                  ? value
                  : `${value} ${child.attributes.transform}`
            }
          }

          delete node.attributes.transform
        }
      },
    },
  }
}
