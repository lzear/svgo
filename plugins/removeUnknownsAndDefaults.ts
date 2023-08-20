// @ts-nocheck

import { collectStylesheet, computeStyle } from '../lib/style'
import { detachNodeFromParent, visitSkip } from '../lib/xast'

import {
  attrsGroups,
  attrsGroupsDefaults,
  elems,
  elemsGroups,
  presentationNonInheritableGroupAttrs,
} from './_collections'
import type { Plugin } from './plugins-types'

export const name = 'removeUnknownsAndDefaults'
export const description =
  'removes unknown elements content and attributes, removes attrs with default values'

// resolve all groups references

const allowedChildrenPerElement = new Map<string, Set<string>>()
const allowedAttributesPerElement = new Map<string, Set<string>>()
const attributesDefaultsPerElement = new Map<string, Map<string, string>>()

for (const [_name, _config] of Object.entries(elems)) {
  const name = _name as keyof typeof elems
  const config = _config
  const allowedChildren = new Set<string>()
  if ('content' in config && config.content) {
    for (const elementName of config.content) {
      allowedChildren.add(elementName)
    }
  }
  if ('contentGroups' in config && config.contentGroups) {
    for (const contentGroupName of config.contentGroups) {
      const elemsGroup =
        elemsGroups[contentGroupName as keyof typeof elemsGroups]
      if (elemsGroup) {
        for (const elementName of elemsGroup) {
          allowedChildren.add(elementName)
        }
      }
    }
  }
  const allowedAttributes = new Set<string>()
  if ('attrs' in config && config.attrs) {
    for (const attrName of config.attrs) {
      allowedAttributes.add(attrName)
    }
  }
  const attributesDefaults = new Map<string, string>()
  if ('defaults' in config && config.defaults) {
    for (const [attrName, defaultValue] of Object.entries(config.defaults)) {
      attributesDefaults.set(attrName, defaultValue)
    }
  }
  if ('attrsGroups' in config && config.attrsGroups)
    for (const attrsGroupName of config.attrsGroups) {
      const attrsGroup = attrsGroups[attrsGroupName as keyof typeof attrsGroups]
      if (attrsGroup) {
        for (const attrName of attrsGroup) {
          allowedAttributes.add(attrName)
        }
      }
      const groupDefaults =
        attrsGroupsDefaults[attrsGroupName as keyof typeof attrsGroupsDefaults]
      if (groupDefaults) {
        for (const [attrName, defaultValue] of Object.entries(groupDefaults)) {
          attributesDefaults.set(attrName, defaultValue)
        }
      }
    }
  allowedChildrenPerElement.set(name, allowedChildren)
  allowedAttributesPerElement.set(name, allowedAttributes)
  attributesDefaultsPerElement.set(name, attributesDefaults)
}

/**
 * Remove unknown elements content and attributes,
 * remove attributes with default values.
 *
 * @author Kir Belevich
 */
export const fn: Plugin<'removeUnknownsAndDefaults'> = (root, params) => {
  const {
    unknownContent = true,
    unknownAttrs = true,
    defaultAttrs = true,
    uselessOverrides = true,
    keepDataAttrs = true,
    keepAriaAttrs = true,
    keepRoleAttr = false,
  } = params
  const stylesheet = collectStylesheet(root)

  return {
    element: {
      enter: (node, parentNode) => {
        // skip namespaced elements
        if (node.name.includes(':')) {
          return
        }
        // skip visiting foreignObject subtree
        if (node.name === 'foreignObject') {
          return visitSkip
        }

        // remove unknown element's content
        if (unknownContent && parentNode.type === 'element') {
          const allowedChildren = allowedChildrenPerElement.get(parentNode.name)
          if (allowedChildren == null || allowedChildren.size === 0) {
            // remove unknown elements
            if (allowedChildrenPerElement.get(node.name) == null) {
              detachNodeFromParent(node, parentNode)
              return
            }
          } else {
            // remove not allowed children
            if (allowedChildren.has(node.name) === false) {
              detachNodeFromParent(node, parentNode)
              return
            }
          }
        }

        const allowedAttributes = allowedAttributesPerElement.get(node.name)
        const attributesDefaults = attributesDefaultsPerElement.get(node.name)
        const computedParentStyle =
          parentNode.type === 'element'
            ? computeStyle(stylesheet, parentNode)
            : null

        // remove element's unknown attrs and attrs with default values
        for (const [name, value] of Object.entries(node.attributes)) {
          if (keepDataAttrs && name.startsWith('data-')) {
            continue
          }
          if (keepAriaAttrs && name.startsWith('aria-')) {
            continue
          }
          if (keepRoleAttr && name === 'role') {
            continue
          }
          // skip xmlns attribute
          if (name === 'xmlns') {
            continue
          }
          // skip namespaced attributes except xml:* and xlink:*
          if (name.includes(':')) {
            const [prefix] = name.split(':')
            if (prefix !== 'xml' && prefix !== 'xlink') {
              continue
            }
          }

          if (
            unknownAttrs &&
            allowedAttributes &&
            allowedAttributes.has(name) === false
          ) {
            delete node.attributes[name]
          }
          if (
            defaultAttrs &&
            node.attributes.id == null &&
            attributesDefaults &&
            attributesDefaults.get(name) === value && // keep defaults if parent has own or inherited style
            (computedParentStyle == null || computedParentStyle[name] == null)
          ) {
            delete node.attributes[name]
          }
          if (uselessOverrides && node.attributes.id == null) {
            const style =
              computedParentStyle == null ? null : computedParentStyle[name]
            if (
              presentationNonInheritableGroupAttrs.includes(name) === false &&
              style != null &&
              style.type === 'static' &&
              style.value === value
            ) {
              delete node.attributes[name]
            }
          }
        }
      },
    },
  }
}
