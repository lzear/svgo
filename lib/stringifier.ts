import { textElems } from '../plugins/_collections'

import type {
  StringifyOptions,
  XastCdata,
  XastComment,
  XastDoctype,
  XastElement,
  XastInstruction,
  XastParent,
  XastRoot,
  XastText,
} from './types'

type State = {
  indent: string
  textContext: null | XastElement
  indentLevel: number
}

type Options = Required<StringifyOptions>

const encodeEntity = (char: string): string => {
  return char in entities ? entities[char as keyof typeof entities] : char
}

const defaults = {
  doctypeStart: '<!DOCTYPE',
  doctypeEnd: '>',
  procInstStart: '<?',
  procInstEnd: '?>',
  tagOpenStart: '<',
  tagOpenEnd: '>',
  tagCloseStart: '</',
  tagCloseEnd: '>',
  tagShortStart: '<',
  tagShortEnd: '/>',
  attrStart: '="',
  attrEnd: '"',
  commentStart: '<!--',
  commentEnd: '-->',
  cdataStart: '<![CDATA[',
  cdataEnd: ']]>',
  textStart: '',
  textEnd: '',
  indent: 4,
  regEntities: /["&'<>]/g,
  regValEntities: /["&<>]/g,
  encodeEntity,
  pretty: false,
  useShortTags: true,
  eol: 'lf' as const,
  finalNewline: false,
}

const entities: Record<string, string> = {
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
  '>': '&gt;',
  '<': '&lt;',
}

/**
 * convert XAST to SVG string
 */
export const stringifySvg = (
  data: XastRoot,
  userOptions?: StringifyOptions,
): string => {
  const config: Options = { ...defaults, ...userOptions }
  const indent = config.indent
  let newIndent = '    '
  if (typeof indent === 'number' && Number.isNaN(indent) === false) {
    newIndent = indent < 0 ? '\t' : ' '.repeat(indent)
  } else if (typeof indent === 'string') {
    newIndent = indent
  }
  const state: State = {
    indent: newIndent,
    textContext: null,
    indentLevel: 0,
  }
  const eol = config.eol === 'crlf' ? '\r\n' : '\n'
  if (config.pretty) {
    config.doctypeEnd += eol
    config.procInstEnd += eol
    config.commentEnd += eol
    config.cdataEnd += eol
    config.tagShortEnd += eol
    config.tagOpenEnd += eol
    config.tagCloseEnd += eol
    config.textEnd += eol
  }
  let svg = stringifyNode(data, config, state)
  if (config.finalNewline && svg.length > 0 && svg.at(-1) !== '\n') {
    svg += eol
  }
  return svg
}

/**
 * @type {(node: XastParent, config: Options, state: State) => string}
 */
const stringifyNode = (data: XastParent, config: Options, state: State) => {
  let svg = ''
  state.indentLevel += 1
  for (const item of data.children) {
    if (item.type === 'element') {
      svg += stringifyElement(item, config, state)
    }
    if (item.type === 'text') {
      svg += stringifyText(item, config, state)
    }
    if (item.type === 'doctype') {
      svg += stringifyDoctype(item, config)
    }
    if (item.type === 'instruction') {
      svg += stringifyInstruction(item, config)
    }
    if (item.type === 'comment') {
      svg += stringifyComment(item, config)
    }
    if (item.type === 'cdata') {
      svg += stringifyCdata(item, config, state)
    }
  }
  state.indentLevel -= 1
  return svg
}

/**
 * create indent string in accordance with the current node level.
 */
const createIndent = (config: Options, state: State) => {
  let indent = ''
  if (config.pretty && state.textContext == null) {
    indent = state.indent.repeat(state.indentLevel - 1)
  }
  return indent
}

const stringifyDoctype = (node: XastDoctype, config: Options) => {
  return config.doctypeStart + node.data.doctype + config.doctypeEnd
}

const stringifyInstruction = (node: XastInstruction, config: Options) => {
  return (
    config.procInstStart + node.name + ' ' + node.value + config.procInstEnd
  )
}

const stringifyComment = (node: XastComment, config: Options) => {
  return config.commentStart + node.value + config.commentEnd
}

const stringifyCdata = (node: XastCdata, config: Options, state: State) => {
  return (
    createIndent(config, state) +
    config.cdataStart +
    node.value +
    config.cdataEnd
  )
}

const stringifyElement = (node: XastElement, config: Options, state: State) => {
  // empty element and short tag
  if (node.children.length === 0) {
    return config.useShortTags
      ? createIndent(config, state) +
          config.tagShortStart +
          node.name +
          stringifyAttributes(node, config) +
          config.tagShortEnd
      : createIndent(config, state) +
          config.tagShortStart +
          node.name +
          stringifyAttributes(node, config) +
          config.tagOpenEnd +
          config.tagCloseStart +
          node.name +
          config.tagCloseEnd
    // non-empty element
  } else {
    let tagOpenStart = config.tagOpenStart
    let tagOpenEnd = config.tagOpenEnd
    let tagCloseStart = config.tagCloseStart
    let tagCloseEnd = config.tagCloseEnd
    let openIndent = createIndent(config, state)
    let closeIndent = createIndent(config, state)

    if (state.textContext) {
      tagOpenStart = defaults.tagOpenStart
      tagOpenEnd = defaults.tagOpenEnd
      tagCloseStart = defaults.tagCloseStart
      tagCloseEnd = defaults.tagCloseEnd
      openIndent = ''
    } else if (textElems.includes(node.name)) {
      tagOpenEnd = defaults.tagOpenEnd
      tagCloseStart = defaults.tagCloseStart
      closeIndent = ''
      state.textContext = node
    }

    const children = stringifyNode(node, config, state)

    if (state.textContext === node) {
      state.textContext = null
    }

    return (
      openIndent +
      tagOpenStart +
      node.name +
      stringifyAttributes(node, config) +
      tagOpenEnd +
      children +
      closeIndent +
      tagCloseStart +
      node.name +
      tagCloseEnd
    )
  }
}

const stringifyAttributes = (node: XastElement, config: Options) => {
  let attrs = ''
  for (const [name, value] of Object.entries(node.attributes)) {
    // TODO remove attributes without values support in v3
    if (value === undefined) {
      attrs += ' ' + name
    } else {
      const encodedValue = value
        .toString()
        .replace(config.regValEntities, config.encodeEntity)
      attrs += ' ' + name + config.attrStart + encodedValue + config.attrEnd
    }
  }
  return attrs
}

const stringifyText = (node: XastText, config: Options, state: State) => {
  return (
    createIndent(config, state) +
    config.textStart +
    node.value.replace(config.regEntities, config.encodeEntity) +
    (state.textContext ? '' : config.textEnd)
  )
}
