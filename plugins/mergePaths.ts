import { collectStylesheet, computeStyle } from '../lib/style'
import { detachNodeFromParent } from '../lib/xast'

import { intersects, js2path, path2js } from './_path'
import type { Plugin } from './plugins-types'

export const name = 'mergePaths'
export const description = 'merges multiple paths in one if possible'

/**
 * Merge multiple Paths into one.
 *
 * @author Kir Belevich, Lev Solntsev
 *
 */
export const fn: Plugin<'mergePaths'> = (root, params) => {
  const {
    force = false,
    floatPrecision,
    noSpaceAfterFlags = false, // a20 60 45 0 1 30 20 → a20 60 45 0130 20
  } = params
  const stylesheet = collectStylesheet(root)

  return {
    element: {
      enter: (node) => {
        let prevChild = null

        for (const child of node.children) {
          // skip if previous element is not path or contains animation elements
          if (
            prevChild == null ||
            prevChild.type !== 'element' ||
            prevChild.name !== 'path' ||
            prevChild.children.length > 0 ||
            prevChild.attributes.d == null
          ) {
            prevChild = child
            continue
          }

          // skip if element is not path or contains animation elements
          if (
            child.type !== 'element' ||
            child.name !== 'path' ||
            child.children.length > 0 ||
            child.attributes.d == null
          ) {
            prevChild = child
            continue
          }

          // preserve paths with markers
          const computedStyle = computeStyle(stylesheet, child)
          if (
            computedStyle['marker-start'] ||
            computedStyle['marker-mid'] ||
            computedStyle['marker-end']
          ) {
            prevChild = child
            continue
          }

          const prevChildAttrs = Object.keys(prevChild.attributes)
          const childAttrs = Object.keys(child.attributes)
          let attributesAreEqual = prevChildAttrs.length === childAttrs.length
          for (const name of childAttrs) {
            if (
              name !== 'd' &&
              (prevChild.attributes[name] == null ||
                prevChild.attributes[name] !== child.attributes[name])
            ) {
              attributesAreEqual = false
            }
          }
          const prevPathJS = path2js(prevChild)
          const curPathJS = path2js(child)

          if (
            attributesAreEqual &&
            (force || !intersects(prevPathJS, curPathJS))
          ) {
            js2path(prevChild, prevPathJS.concat(curPathJS), {
              floatPrecision,
              noSpaceAfterFlags,
            })
            detachNodeFromParent(child, node)
            continue
          }

          prevChild = child
        }
      },
    },
  }
}
