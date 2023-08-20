import { attrsGroups } from './_collections'
import type { Plugin } from './plugins-types'

export const name = 'convertStyleToAttrs'
export const description = 'converts style to attributes'

const g = (...args: string[]) => {
  return '(?:' + args.join('|') + ')'
}

const stylingProps = attrsGroups.presentation
const rEscape = '\\\\(?:[0-9a-f]{1,6}\\s?|\\r\\n|.)' // Like \" or \2051. Code points consume one space.
const rAttr = '\\s*(' + g('[^:;\\\\]', rEscape) + '*?)\\s*' // attribute name like ‘fill’
const rSingleQuotes = "'(?:[^'\\n\\r\\\\]|" + rEscape + ")*?(?:'|$)" // string in single quotes: 'smth'
const rQuotes = '"(?:[^"\\n\\r\\\\]|' + rEscape + ')*?(?:"|$)' // string in double quotes: "smth"
const rQuotedString = new RegExp('^' + g(rSingleQuotes, rQuotes) + '$')
// Parentheses, E.g.: url(data:image/png;base64,iVBO...).
// ':' and ';' inside of it should be threated as is. (Just like in strings.)
const rParenthesis =
  '\\(' + g('[^\'"()\\\\]+', rEscape, rSingleQuotes, rQuotes) + '*?' + '\\)'
// The value. It can have strings and parentheses (see above). Fallbacks to anything in case of unexpected input.
const rValue =
  '\\s*(' +
  g(
    '[^!\'"();\\\\]+?',
    rEscape,
    rSingleQuotes,
    rQuotes,
    rParenthesis,
    '[^;]*?',
  ) +
  '*?' +
  ')'
// End of declaration. Spaces outside of capturing groups help to do natural trimming.
const rDeclEnd = '\\s*(?:;\\s*|$)'
// Important rule
const rImportant = '(\\s*!important(?![-(\\w]))?'
// Final RegExp to parse CSS declarations.
const regDeclarationBlock = new RegExp(
  rAttr + ':' + rValue + rImportant + rDeclEnd,
  'ig',
)
// Comments expression. Honors escape sequences and strings.
const regStripComments = new RegExp(
  g(rEscape, rSingleQuotes, rQuotes, '/\\*[^]*?\\*/'),
  'ig',
)

/**
 * Convert style in attributes. Cleanups comments and illegal declarations (without colon) as a side effect.
 *
 * @example
 * <g style="fill:#000; color: #fff;">
 *             ⬇
 * <g fill="#000" color="#fff">
 *
 * @example
 * <g style="fill:#000; color: #fff; -webkit-blah: blah">
 *             ⬇
 * <g fill="#000" color="#fff" style="-webkit-blah: blah">
 *
 * @author Kir Belevich
 */
export const fn: Plugin<'convertStyleToAttrs'> = (_root, params) => {
  const { keepImportant = false } = params
  return {
    element: {
      enter: (node) => {
        if (node.attributes.style != null) {
          // ['opacity: 1', 'color: #000']
          let styles = []
          const newAttributes: Record<string, string> = {}

          // Strip CSS comments preserving escape sequences and strings.
          const styleValue = node.attributes.style.replace(
            regStripComments,
            (match) => {
              return match[0] == '/'
                ? ''
                : match[0] == '\\' && /[g-z-]/i.test(match[1])
                ? match[1]
                : match
            },
          )

          regDeclarationBlock.lastIndex = 0
          for (let rule; (rule = regDeclarationBlock.exec(styleValue)); ) {
            if (!keepImportant || !rule[3]) {
              styles.push([rule[1], rule[2]])
            }
          }

          if (styles.length > 0) {
            styles = styles.filter(function (style) {
              if (style[0]) {
                let prop = style[0].toLowerCase(),
                  val = style[1]

                if (rQuotedString.test(val)) {
                  val = val.slice(1, -1)
                }

                if (stylingProps.includes(prop)) {
                  newAttributes[prop] = val

                  return false
                }
              }

              return true
            })

            Object.assign(node.attributes, newAttributes)

            if (styles.length > 0) {
              node.attributes.style = styles
                .map((declaration) => declaration.join(':'))
                .join(';')
            } else {
              delete node.attributes.style
            }
          }
        }
      },
    },
  }
}
