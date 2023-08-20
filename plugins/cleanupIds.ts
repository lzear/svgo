// @ts-nocheck

/**
 * @typedef {import('../lib/types').XastElement} XastElement
 */

import { visitSkip } from '../lib/xast'

import { referencesProps } from './_collections'

export const name = 'cleanupIds'
export const description = 'removes unused IDs and minifies used'

const regReferencesUrl = /\burl\((["'])?#(.+?)\1\)/
const regReferencesHref = /^#(.+?)$/
const regReferencesBegin = /(\D+)\./
const generateIdChars = [
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
]
const maxIdIndex = generateIdChars.length - 1

/**
 * Check if an ID starts with any one of a list of strings.
 *
 * @type {(string: string, prefixes: Array<string>) => boolean}
 */
const hasStringPrefix = (string, prefixes) => {
  for (const prefix of prefixes) {
    if (string.startsWith(prefix)) {
      return true
    }
  }
  return false
}

/**
 * Generate unique minimal ID.
 *
 * @type {(currentId: null | Array<number>) => Array<number>}
 */
const generateId = (currentId) => {
  if (currentId == null) {
    return [0]
  }
  currentId[currentId.length - 1] += 1
  for (let i = currentId.length - 1; i > 0; i--) {
    if (currentId[i] > maxIdIndex) {
      currentId[i] = 0
      if (currentId[i - 1] !== undefined) {
        currentId[i - 1]++
      }
    }
  }
  if (currentId[0] > maxIdIndex) {
    currentId[0] = 0
    currentId.unshift(0)
  }
  return currentId
}

/**
 * Get string from generated ID array.
 *
 * @type {(arr: Array<number>) => string}
 */
const getIdString = (arr) => {
  return arr.map((i) => generateIdChars[i]).join('')
}

/**
 * Remove unused and minify used IDs
 * (only if there are no any <style> or <script>).
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types').Plugin<'cleanupIds'>}
 */
export const fn = (_root, params) => {
  const {
    remove = true,
    minify = true,
    preserve = [],
    preservePrefixes = [],
    force = false,
  } = params
  const preserveIds = new Set(
    Array.isArray(preserve) ? preserve : preserve ? [preserve] : [],
  )
  const preserveIdPrefixes = Array.isArray(preservePrefixes)
    ? preservePrefixes
    : preservePrefixes
    ? [preservePrefixes]
    : []
  /**
   * @type {Map<string, XastElement>}
   */
  const nodeById = new Map()
  /**
   * @type {Map<string, Array<{element: XastElement, name: string, value: string }>>}
   */
  const referencesById = new Map()
  let deoptimized = false

  return {
    element: {
      enter: (node) => {
        if (force == false) {
          // deoptimize if style or script elements are present
          if (
            (node.name === 'style' || node.name === 'script') &&
            node.children.length > 0
          ) {
            deoptimized = true
            return
          }

          // avoid removing IDs if the whole SVG consists only of defs
          if (node.name === 'svg') {
            let hasDefsOnly = true
            for (const child of node.children) {
              if (child.type !== 'element' || child.name !== 'defs') {
                hasDefsOnly = false
                break
              }
            }
            if (hasDefsOnly) {
              return visitSkip
            }
          }
        }

        for (const [name, value] of Object.entries(node.attributes)) {
          if (name === 'id') {
            // collect all ids
            const id = value
            if (nodeById.has(id)) {
              delete node.attributes.id // remove repeated id
            } else {
              nodeById.set(id, node)
            }
          } else {
            // collect all references
            /**
             * @type {null | string}
             */
            let id = null
            if (referencesProps.includes(name)) {
              const match = value.match(regReferencesUrl)
              if (match != null) {
                id = match[2] // url() reference
              }
            }
            if (name === 'href' || name.endsWith(':href')) {
              const match = value.match(regReferencesHref)
              if (match != null) {
                id = match[1] // href reference
              }
            }
            if (name === 'begin') {
              const match = value.match(regReferencesBegin)
              if (match != null) {
                id = match[1] // href reference
              }
            }
            if (id != null) {
              let refs = referencesById.get(id)
              if (refs == null) {
                refs = []
                referencesById.set(id, refs)
              }
              refs.push({ element: node, name, value })
            }
          }
        }
      },
    },

    root: {
      exit: () => {
        if (deoptimized) {
          return
        }
        /**
         * @type {(id: string) => boolean}
         **/
        const isIdPreserved = (id) =>
          preserveIds.has(id) || hasStringPrefix(id, preserveIdPrefixes)
        /**
         * @type {null | Array<number>}
         */
        let currentId = null
        for (const [id, refs] of referencesById) {
          const node = nodeById.get(id)
          if (node != null) {
            // replace referenced IDs with the minified ones
            if (minify && isIdPreserved(id) === false) {
              /**
               * @type {null | string}
               */
              let currentIdString = null
              do {
                currentId = generateId(currentId)
                currentIdString = getIdString(currentId)
              } while (isIdPreserved(currentIdString))
              node.attributes.id = currentIdString
              for (const { element, name, value } of refs) {
                if (value.includes('#')) {
                  // replace id in href and url()
                  element.attributes[name] = value.replace(
                    `#${id}`,
                    `#${currentIdString}`,
                  )
                } else {
                  // replace id in begin attribute
                  element.attributes[name] = value.replace(
                    `${id}.`,
                    `${currentIdString}.`,
                  )
                }
              }
            }
            // keep referenced node
            nodeById.delete(id)
          }
        }
        // remove non-referenced IDs attributes from elements
        if (remove) {
          for (const [id, node] of nodeById) {
            if (isIdPreserved(id) === false) {
              delete node.attributes.id
            }
          }
        }
      },
    },
  }
}
