import { parseSvg } from './parser.js';
import { stringifyAst } from './stringifier.js';

const input = `<svg xmlns="http://www.w3.org/2000/svg">
<text x="10" y="35" xml:space="preserve">
    <a href="x">
this is a test
    </a>
</text>
<text x="10" y="35" xml:space="preserve">
    <tspan>
this is a test
    </tspan>
</text>
</svg>`;

const expected = `<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="35" xml:space="preserve">
    <a href="x">
this is a test
    </a>
</text><text x="10" y="35" xml:space="preserve">
    <tspan>
this is a test
    </tspan>
</text></svg>`;

test('a text preserved', () => {
  const parsed = parseSvg(input);
  const actual = stringifyAst(parsed, {});

  expect(actual).toBe(expected);
});
