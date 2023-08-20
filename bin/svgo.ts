#!/usr/bin/env TS_NODE_TRANSPILE_ONLY=1 -S node --no-warnings --loader ts-node/esm --es-module-specifier-resolution=node

import { program } from 'commander'
import colors from 'picocolors'

import makeProgram from '../lib/svgo/coa'

makeProgram(program)
program.parseAsync(process.argv).catch((error) => {
  console.error(colors.red(error.stack))
  process.exit(1)
})
