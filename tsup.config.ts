import type { Format } from 'tsup'
import { defineConfig } from 'tsup'

export default defineConfig((options) => {
  return {
    entry: ['./lib/svgo.ts'],
    clean: !options.watch,
    dts: true,
    minify: !options.watch,
    target: 'es2015',
    format: ['esm', 'cjs', 'iife'] as Format[],
    bundle: true,
  }
})
