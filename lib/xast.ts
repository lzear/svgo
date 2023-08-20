'use strict';

/**
 * @typedef {import('./types').XastNode} XastNode
 * @typedef {import('./types').XastChild} XastChild
 * @typedef {import('./types').XastParent} XastParent
 * @typedef {import('./types').Visitor} Visitor
 */

import { selectAll, selectOne, is } from 'css-select';
import xastAdaptor from './svgo/css-select-adapter';

const cssSelectOptions = {
  xmlMode: true,
  adapter: xastAdaptor,
};

/**
 * @type {(node: XastNode, selector: string) => Array<XastChild>}
 */
export const querySelectorAll = (node, selector) => {
  return selectAll(selector, node, cssSelectOptions);
};

/**
 * @type {(node: XastNode, selector: string) => null | XastChild}
 */
export const querySelector = (node, selector) => {
  return selectOne(selector, node, cssSelectOptions);
};

/**
 * @type {(node: XastChild, selector: string) => boolean}
 */
export const matches = (node, selector) => {
  return is(node, selector, cssSelectOptions);
};

export const visitSkip = Symbol();

/**
 * @type {(node: XastNode, visitor: Visitor, parentNode?: any) => void}
 */
export const visit = (node, visitor, parentNode) => {
  const callbacks = visitor[node.type];
  if (callbacks && callbacks.enter) {
    // @ts-ignore hard to infer
    const symbol = callbacks.enter(node, parentNode);
    if (symbol === visitSkip) {
      return;
    }
  }
  // visit root children
  if (node.type === 'root') {
    // copy children array to not loose cursor when children is spliced
    for (const child of node.children) {
      visit(child, visitor, node);
    }
  }
  // visit element children if still attached to parent
  if (node.type === 'element') {
    if (parentNode.children.includes(node)) {
      for (const child of node.children) {
        visit(child, visitor, node);
      }
    }
  }
  if (callbacks && callbacks.exit) {
    // @ts-ignore hard to infer
    callbacks.exit(node, parentNode);
  }
};

/**
 * @type {(node: XastChild, parentNode: XastParent) => void}
 */
export const detachNodeFromParent = (node, parentNode) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node);
};
