import type { Visitor, XastRoot } from '../lib/types.js';

export const name = 'addIds';
export const description = 'Ensure that every element has an ID';

const rString = (rng = Math.random) => (rng() + 1).toString(36).slice(7);
const prefix = 'id';

export const fn = (root: XastRoot): Visitor => {
  const ids = new Set<string>();
  const gatherIds = (node: any) => {
    if (node?.attributes?.id) ids.add(node.attributes.id);
    if (node.children) {
      node.children.forEach(gatherIds);
    }
  };
  const genId = () => {
    let id;
    do {
      id = `${prefix}${rString()}`;
    } while (ids.has(id));
    ids.add(id);
    return id;
  };

  // First pass: gather existing IDs
  gatherIds(root);

  // Second pass: add IDs
  return {
    element: {
      enter: (node) => {
        if (node.attributes) node.attributes.id ??= genId();
      },
    },
  };
};
