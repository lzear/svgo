import type { Plugin } from './plugins-types'

export const name = 'sortDefsChildren'
export const description = 'Sorts children of <defs> to improve compression'
/**
 * Sorts children of defs in order to improve compression.
 * Sorted first by frequency then by element name length then by element name (to ensure grouping).
 *
 * @author David Leston
 */
export const fn: Plugin<'sortDefsChildren'> = () => {
  return {
    element: {
      enter: (node) => {
        if (node.name === 'defs') {
          const frequencies = new Map<string, number>()
          for (const child of node.children) {
            if (child.type === 'element') {
              const frequency = frequencies.get(child.name)
              if (frequency == null) {
                frequencies.set(child.name, 1)
              } else {
                frequencies.set(child.name, frequency + 1)
              }
            }
          }
          node.children.sort((a, b) => {
            if (a.type !== 'element' || b.type !== 'element') {
              return 0
            }
            const aFrequency = frequencies.get(a.name)
            const bFrequency = frequencies.get(b.name)
            if (aFrequency != null && bFrequency != null) {
              const frequencyComparison = bFrequency - aFrequency
              if (frequencyComparison !== 0) {
                return frequencyComparison
              }
            }
            const lengthComparison = b.name.length - a.name.length
            if (lengthComparison !== 0) {
              return lengthComparison
            }
            if (a.name !== b.name) {
              return a.name > b.name ? -1 : 1
            }
            return 0
          })
        }
      },
    },
  }
}
