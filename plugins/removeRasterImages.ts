import { detachNodeFromParent } from '../lib/xast'

export const name = 'removeRasterImages'
export const description = 'removes raster images (disabled by default)'

/**
 * Remove raster images references in <image>.
 *
 * @see https://bugs.webkit.org/show_bug.cgi?id=63548
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types').Plugin<'removeRasterImages'>}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (
          node.name === 'image' &&
          node.attributes['xlink:href'] != null &&
          /(\.|image\/)(jpg|png|gif)/.test(node.attributes['xlink:href'])
        ) {
          detachNodeFromParent(node, parentNode)
        }
      },
    },
  }
}
