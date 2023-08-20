import { detachNodeFromParent } from '../lib/xast';

export const name = 'removeComments';
export const description = 'removes comments';

/**
 * Remove comments.
 *
 * @example
 * <!-- Generator: Adobe Illustrator 15.0.0, SVG Export
 * Plug-In . SVG Version: 6.00 Build 0)  -->
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types').Plugin<'removeComments'>}
 */
export const fn = () => {
  return {
    comment: {
      enter: (node, parentNode) => {
        if (node.value.charAt(0) !== '!') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
