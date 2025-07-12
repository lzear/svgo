import path from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'node:fs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkgPath = path.join(__dirname, './package.json');
const PKG = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

/** @type {import('@rollup/plugin-terser').Options} */
const terserOptions = {
  compress: {
    defaults: false,
    arrows: true,
    computed_props: true,
    conditionals: true,
    dead_code: true,
    drop_debugger: true,
    evaluate: true,
  },
  mangle: false,
  format: {
    comments: false,
    keep_numbers: true,
    semicolons: false,
    shebang: false,
  },
};

/** @type {import('rollup').RollupOptions[]} */
const config = [
  {
    input: './lib/svgo-node.js',
    output: {
      file: './dist/svgo-node.cjs',
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
    external: [
      'os',
      'fs/promises',
      'url',
      'path',
      ...Object.keys(PKG.dependencies),
    ],
    onwarn(warning) {
      throw Error(warning.toString());
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        declaration: true,
        declarationDir: './dist/types',
        allowJs: true,
      }),
      terser(terserOptions),
    ],
  },
  {
    input: './lib/svgo.js',
    output: {
      file: './dist/svgo.browser.js',
      format: 'esm',
      sourcemap: true,
    },
    onwarn(warning) {
      throw Error(warning.toString());
    },
    plugins: [
      nodeResolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        allowJs: true,
      }),
      terser(terserOptions),
    ],
  },
];

export default config;
