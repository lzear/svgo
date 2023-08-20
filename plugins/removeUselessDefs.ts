/**
 * @typedef {import('../lib/types').XastElement} XastElement
 */

import { detachNodeFromParent } from '../lib/xast';
import { elemsGroups } from './_collections';

export const name = 'removeUselessDefs';
export const description = 'removes elements in <defs> without id';

/**
 * Removes content of defs and properties that aren't rendered directly without ids.
 *
 * @author Lev Solntsev
 *
 * @type {import('./plugins-types').Plugin<'removeUselessDefs'>}
 */
export const fn = () => {
  return {
    element: {
      enter: (node, parentNode) => {
        if (node.name === 'defs') {
          /**
           * @type {Array<XastElement>}
           */
          const usefulNodes = [];
          collectUsefulNodes(node, usefulNodes);
          if (usefulNodes.length === 0) {
            detachNodeFromParent(node, parentNode);
          }
          // TODO remove legacy parentNode in v4
          for (const usefulNode of usefulNodes) {
            Object.defineProperty(usefulNode, 'parentNode', {
              writable: true,
              value: node,
            });
          }
          node.children = usefulNodes;
        } else if (
          elemsGroups.nonRendering.includes(node.name) &&
          node.attributes.id == null
        ) {
          detachNodeFromParent(node, parentNode);
        }
      },
    },
  };
};

/**
 * @type {(node: XastElement, usefulNodes: Array<XastElement>) => void}
 */
const collectUsefulNodes = (node, usefulNodes) => {
  for (const child of node.children) {
    if (child.type === 'element') {
      if (child.attributes.id != null || child.name === 'style') {
        usefulNodes.push(child);
      } else {
        collectUsefulNodes(child, usefulNodes);
      }
    }
  }
};
