'use strict';

import { attrsGroups } from './_collections';

export const name = 'removeEmptyAttrs';
export const description = 'removes empty attributes';

/**
 * Remove attributes with empty values.
 *
 * @author Kir Belevich
 *
 * @type {import('./plugins-types').Plugin<'removeEmptyAttrs'>}
 */
export const fn = () => {
  return {
    element: {
      enter: (node) => {
        for (const [name, value] of Object.entries(node.attributes)) {
          if (
            value === '' &&
            // empty conditional processing attributes prevents elements from rendering
            attrsGroups.conditionalProcessing.includes(name) === false
          ) {
            delete node.attributes[name];
          }
        }
      },
    },
  };
};
