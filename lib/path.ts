import { removeLeadingZero } from './svgo/tools'
import type { PathDataCommand, PathDataItem } from './types'

// Based on https://www.w3.org/TR/SVG11/paths.html#PathDataBNF

const argsCountPerCommand = {
  M: 2,
  m: 2,
  Z: 0,
  z: 0,
  L: 2,
  l: 2,
  H: 1,
  h: 1,
  V: 1,
  v: 1,
  C: 6,
  c: 6,
  S: 4,
  s: 4,
  Q: 4,
  q: 4,
  T: 2,
  t: 2,
  A: 7,
  a: 7,
}

const isCommand = (c: string): c is PathDataCommand => {
  return c in argsCountPerCommand
}

const isWsp = (c: string): boolean => {
  const codePoint = c.codePointAt(0)
  return (
    codePoint === 0x20 ||
    codePoint === 0x9 ||
    codePoint === 0xd ||
    codePoint === 0xa
  )
}

const isDigit = (c: string) => {
  const codePoint = c.codePointAt(0)
  if (codePoint == null) {
    return false
  }
  return 48 <= codePoint && codePoint <= 57
}

type ReadNumberState =
  | 'none'
  | 'sign'
  | 'whole'
  | 'decimal_point'
  | 'decimal'
  | 'e'
  | 'exponent_sign'
  | 'exponent'

const readNumber = (
  string: string,
  cursor: number,
): [number, number | null] => {
  let i = cursor
  let value = ''
  let state: ReadNumberState = 'none'
  for (; i < string.length; i += 1) {
    const c = string[i]
    if (c === '+' || c === '-') {
      if (state === 'none') {
        state = 'sign'
        value += c
        continue
      }
      if (state === 'e') {
        state = 'exponent_sign'
        value += c
        continue
      }
    }
    if (isDigit(c)) {
      if (state === 'none' || state === 'sign' || state === 'whole') {
        state = 'whole'
        value += c
        continue
      }
      if (state === 'decimal_point' || state === 'decimal') {
        state = 'decimal'
        value += c
        continue
      }
      if (state === 'e' || state === 'exponent_sign' || state === 'exponent') {
        state = 'exponent'
        value += c
        continue
      }
    }
    if (
      c === '.' &&
      (state === 'none' || state === 'sign' || state === 'whole')
    ) {
      state = 'decimal_point'
      value += c
      continue
    }
    if (
      (c === 'E' || c == 'e') &&
      (state === 'whole' || state === 'decimal_point' || state === 'decimal')
    ) {
      state = 'e'
      value += c
      continue
    }
    break
  }
  const number = Number.parseFloat(value)
  return Number.isNaN(number) ? [cursor, null] : [i - 1, number]
}

export const parsePathData = (string: string): PathDataItem[] => {
  const pathData: PathDataItem[] = []
  let command: null | PathDataCommand = null
  let args: number[] = []
  let argsCount = 0
  let canHaveComma = false
  let hadComma = false
  for (let i = 0; i < string.length; i += 1) {
    const c = string.charAt(i)
    if (isWsp(c)) {
      continue
    }
    // allow comma only between arguments
    if (canHaveComma && c === ',') {
      if (hadComma) {
        break
      }
      hadComma = true
      continue
    }
    if (isCommand(c)) {
      if (hadComma) {
        return pathData
      }
      if (command == null) {
        // moveto should be leading command
        if (c !== 'M' && c !== 'm') {
          return pathData
        }
      } else {
        // stop if previous command arguments are not flushed
        if (args.length > 0) {
          return pathData
        }
      }
      command = c
      args = []
      argsCount = argsCountPerCommand[command]
      canHaveComma = false
      // flush command without arguments
      if (argsCount === 0) {
        pathData.push({ command, args })
      }
      continue
    }
    // avoid parsing arguments if no command detected
    if (command == null) {
      return pathData
    }
    // read next argument
    let newCursor = i
    let number = null
    if (command === 'A' || command === 'a') {
      const position = args.length
      if (
        (position === 0 || position === 1) && // allow only positive number without sign as first two arguments
        c !== '+' &&
        c !== '-'
      ) {
        ;[newCursor, number] = readNumber(string, i)
      }
      if (position === 2 || position === 5 || position === 6) {
        ;[newCursor, number] = readNumber(string, i)
      }
      if (position === 3 || position === 4) {
        // read flags
        if (c === '0') {
          number = 0
        }
        if (c === '1') {
          number = 1
        }
      }
    } else {
      ;[newCursor, number] = readNumber(string, i)
    }
    if (number == null) {
      return pathData
    }
    args.push(number)
    canHaveComma = true
    hadComma = false
    i = newCursor
    // flush arguments when necessary count is reached
    if (args.length === argsCount) {
      pathData.push({ command, args })
      // subsequent moveto coordinates are threated as implicit lineto commands
      if (command === 'M') {
        command = 'L'
      }
      if (command === 'm') {
        command = 'l'
      }
      args = []
    }
  }
  return pathData
}

const stringifyNumber = (number: number, precision?: number): string => {
  if (precision != null) {
    const ratio = 10 ** precision
    number = Math.round(number * ratio) / ratio
  }
  // remove zero whole from decimal number
  return removeLeadingZero(number)
}

/**
 * Elliptical arc large-arc and sweep flags are rendered with spaces
 * because many non-browser environments are not able to parse such paths
 */
const stringifyArgs = (
  command: string,
  args: number[],
  precision?: number,
  disableSpaceAfterFlags?: boolean,
): string => {
  let result = ''
  let prev = ''
  for (const [i, number] of args.entries()) {
    const numberString = stringifyNumber(number, precision)
    if (
      disableSpaceAfterFlags &&
      (command === 'A' || command === 'a') &&
      // consider combined arcs
      (i % 7 === 4 || i % 7 === 5)
    ) {
      result += numberString
    } else if (i === 0 || numberString.startsWith('-')) {
      // avoid space before first and negative numbers
      result += numberString
    } else if (prev.includes('.') && numberString.startsWith('.')) {
      // remove space before decimal with zero whole
      // only when previous number is also decimal
      result += numberString
    } else {
      result += ` ${numberString}`
    }
    prev = numberString
  }
  return result
}

type StringifyPathDataOptions = {
  pathData: Array<PathDataItem>
  precision?: number
  disableSpaceAfterFlags?: boolean
}

export const stringifyPathData = ({
  pathData,
  precision,
  disableSpaceAfterFlags,
}: StringifyPathDataOptions): string => {
  // combine sequence of the same commands
  const combined: { command: PathDataCommand; args: number[] }[] = []
  for (const [i, { command, args }] of pathData.entries()) {
    if (i === 0) {
      combined.push({ command, args })
    } else {
      const last: PathDataItem | undefined = combined.at(-1)
      if (!last) {
        throw new Error('Unexpected error')
      }
      // match leading moveto with following lineto
      if (i === 1) {
        if (command === 'L') {
          last.command = 'M'
        }
        if (command === 'l') {
          last.command = 'm'
        }
      }
      if (
        (last.command === command &&
          last.command !== 'M' &&
          last.command !== 'm') ||
        // combine matching moveto and lineto sequences
        (last.command === 'M' && command === 'L') ||
        (last.command === 'm' && command === 'l')
      ) {
        last.args = [...last.args, ...args]
      } else {
        combined.push({ command, args })
      }
    }
  }
  let result = ''
  for (const { command, args } of combined) {
    result +=
      command + stringifyArgs(command, args, precision, disableSpaceAfterFlags)
  }
  return result
}
