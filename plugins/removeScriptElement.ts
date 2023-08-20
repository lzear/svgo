import { detachNodeFromParent } from '../lib/xast';

export const name = 'removeScriptElement';
export const description = 'removes <script> elements (disabled by default)';

/**
 * Remove <script>.
 *
 * https://www.w3.org/TR/SVG11/script.html
 *
 * @author Patrick Klingemann
 *
 * @type {import('./plugins-types').Plugin<'removeScriptElement'>}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'script') {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};
