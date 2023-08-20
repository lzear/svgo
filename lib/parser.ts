// @ts-nocheck

// @ts-ignore sax will be replaced with something else later
import SAX from '@trysound/sax'

import { textElems } from '../plugins/_collections'

import type {
  XastCdata,
  XastChild,
  XastComment,
  XastDoctype,
  XastElement,
  XastInstruction,
  XastParent,
  XastRoot,
  XastText,
} from './types'

class SvgoParserError extends Error {
  private column: number
  private reason: string
  private line: number
  private source: string

  constructor(
    message: string,
    line: number,
    column: number,
    source: string,
    file?: string,
  ) {
    super(message)
    this.name = 'SvgoParserError'
    this.message = `${file || '<input>'}:${line}:${column}: ${message}`
    this.reason = message
    this.line = line
    this.column = column
    this.source = source
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SvgoParserError)
    }
  }
  toString() {
    const lines = this.source.split(/\r?\n/)
    const startLine = Math.max(this.line - 3, 0)
    const endLine = Math.min(this.line + 2, lines.length)
    const lineNumberWidth = String(endLine).length
    const startColumn = Math.max(this.column - 54, 0)
    const endColumn = Math.max(this.column + 20, 80)
    const code = lines
      .slice(startLine, endLine)
      .map((line, index) => {
        const lineSlice = line.slice(startColumn, endColumn)
        let ellipsisPrefix = ''
        let ellipsisSuffix = ''
        if (startColumn !== 0) {
          ellipsisPrefix = startColumn > line.length - 1 ? ' ' : '…'
        }
        if (endColumn < line.length - 1) {
          ellipsisSuffix = '…'
        }
        const number = startLine + 1 + index
        const gutter = ` ${number.toString().padStart(lineNumberWidth)} | `
        if (number === this.line) {
          const gutterSpacing = gutter.replaceAll(/[^|]/g, ' ')
          const lineSpacing = (
            ellipsisPrefix + line.slice(startColumn, this.column - 1)
          ).replaceAll(/[^\t]/g, ' ')
          const spacing = gutterSpacing + lineSpacing
          return `>${gutter}${ellipsisPrefix}${lineSlice}${ellipsisSuffix}\n ${spacing}^`
        }
        return ` ${gutter}${ellipsisPrefix}${lineSlice}${ellipsisSuffix}`
      })
      .join('\n')
    return `${this.name}: ${this.message}\n\n${code}\n`
  }
}

const entityDeclaration = /<!ENTITY\s+(\S+)\s+(?:'([^']+)'|"([^"]+)")\s*>/g

const config = {
  strict: true,
  trim: false,
  normalize: false,
  lowercase: true,
  xmlns: true,
  position: true,
}

/**
 * Convert SVG (XML) string to SVG-as-JS object.
 */
export const parseSvg = (data: string, from?: string) => {
  const sax = SAX.parser(config.strict, config)
  const root: XastRoot = { type: 'root' as const, children: [] }
  let current: XastParent = root
  const stack: XastParent[] = [root]

  const pushToContent = (node: XastChild) => {
    // TODO remove legacy parentNode in v4
    Object.defineProperty(node, 'parentNode', {
      writable: true,
      value: current,
    })
    current.children.push(node)
  }

  sax.ondoctype = (doctype: string) => {
    const node: XastDoctype = {
      type: 'doctype',
      // TODO parse doctype for name, public and system to match xast
      name: 'svg',
      data: {
        doctype,
      },
    }
    pushToContent(node)
    const subsetStart = doctype.indexOf('[')
    if (subsetStart >= 0) {
      entityDeclaration.lastIndex = subsetStart
      let entityMatch = entityDeclaration.exec(data)
      while (entityMatch != null) {
        sax.ENTITIES[entityMatch[1]] = entityMatch[2] || entityMatch[3]
        entityMatch = entityDeclaration.exec(data)
      }
    }
  }

  sax.onprocessinginstruction = (data: { name: string; body: string }) => {
    const node: XastInstruction = {
      type: 'instruction',
      name: data.name,
      value: data.body,
    }
    pushToContent(node)
  }

  sax.oncomment = (comment: string) => {
    const node: XastComment = {
      type: 'comment',
      value: comment.trim(),
    }
    pushToContent(node)
  }

  sax.oncdata = (cdata: string) => {
    const node: XastCdata = {
      type: 'cdata',
      value: cdata,
    }
    pushToContent(node)
  }

  sax.onopentag = (data: {
    name: string
    attributes: Record<string, { value: string }>
  }) => {
    const element: XastElement = {
      type: 'element',
      name: data.name,
      attributes: {},
      children: [],
    }
    for (const [name, attr] of Object.entries(data.attributes)) {
      element.attributes[name] = attr.value
    }
    pushToContent(element)
    current = element
    stack.push(element)
  }

  // eslint-disable-next-line unicorn/prefer-add-event-listener
  sax.ontext = (text: string) => {
    if (current.type === 'element') {
      // prevent trimming of meaningful whitespace inside textual tags
      if (textElems.includes(current.name)) {
        const node: XastText = {
          type: 'text',
          value: text,
        }
        pushToContent(node)
      } else if (/\S/.test(text)) {
        const node: XastText = {
          type: 'text',
          value: text.trim(),
        }
        pushToContent(node)
      }
    }
  }

  sax.onclosetag = () => {
    stack.pop()
    current = stack.at(-1) || current
  }

  sax.onerror = (e: {
    line: number
    reason: string
    column: number
    from: string
    message: string
  }) => {
    const error = new SvgoParserError(
      e.reason,
      e.line + 1,
      e.column,
      data,
      from,
    )
    if (!e.message.includes('Unexpected end')) {
      throw error
    }
  }

  sax.write(data).close()
  return root
}
