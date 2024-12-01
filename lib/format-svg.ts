import { parseSvg } from './parser.js';
import { stringifyAst } from './stringifier.js';
import type { StringifyOptions } from './types.js';

export const _formatSvg = (
  input: string,
  userOptions: StringifyOptions = { indent: 2, pretty: true },
) => {
  const ast = parseSvg(input);
  return stringifyAst(ast, userOptions);
};
