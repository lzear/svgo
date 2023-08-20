import { detachNodeFromParent } from '../lib/xast';

export const name = 'removeMetadata';
export const description = 'removes <metadata>';

/**
 * Remove <metadata>.
 *
 * https://www.w3.org/TR/SVG11/metadata.html
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types').Plugin<'removeMetadata'>}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'metadata') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
