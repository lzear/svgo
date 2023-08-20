// @ts-nocheck

import { is, selectAll, selectOne } from 'css-select'

import xastAdaptor from './svgo/css-select-adapter'
import type { Visitor, XastChild, XastNode, XastParent } from './types'

const cssSelectOptions = {
  xmlMode: true,
  adapter: xastAdaptor,
}

export const querySelectorAll = (
  node: XastNode,
  selector: string,
): XastChild[] => {
  return selectAll(selector, node, cssSelectOptions)
}

export const querySelector = (
  node: XastNode,
  selector: string,
): null | XastChild => {
  return selectOne(selector, node, cssSelectOptions)
}

export const matches = (node: XastChild, selector: string): boolean => {
  return is(node, selector, cssSelectOptions)
}

export const visitSkip = Symbol()

export const visit = (
  node: XastNode,
  visitor: Visitor,
  parentNode?: XastParent,
) => {
  const callbacks = visitor[node.type]
  if (callbacks && callbacks.enter) {
    // @ts-ignore hard to infer
    const symbol = callbacks.enter(node, parentNode)
    if (symbol === visitSkip) {
      return
    }
  }
  // visit root children
  if (node.type === 'root') {
    // copy children array to not loose cursor when children is spliced
    for (const child of node.children) {
      visit(child, visitor, node)
    }
  }
  // visit element children if still attached to parent
  if (node.type === 'element' && parentNode.children.includes(node)) {
    for (const child of node.children) {
      visit(child, visitor, node)
    }
  }
  if (callbacks && callbacks.exit) {
    // @ts-ignore hard to infer
    callbacks.exit(node, parentNode)
  }
}

export const detachNodeFromParent = (
  node: XastChild,
  parentNode: XastParent,
) => {
  // avoid splice to not break for loops
  parentNode.children = parentNode.children.filter((child) => child !== node)
}
