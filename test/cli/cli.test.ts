import type { ChildProcessWithoutNullStreams } from 'node:child_process'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const waitStdout = (proc: ChildProcessWithoutNullStreams): Promise<string> => {
  return new Promise((resolve) => {
    proc.stdout.on('data', (data) => {
      resolve(data.toString())
    })
  })
}

const waitClose = (proc: ChildProcessWithoutNullStreams): Promise<void> => {
  return new Promise((resolve) => {
    proc.on('close', () => {
      resolve()
    })
  })
}

const logProc = (proc: ChildProcessWithoutNullStreams): void => {
  proc.stdout.on('data', (data: { toString: () => string }) => {
    console.log(data.toString())
  })
  proc.stderr.on('data', (data: { toString: () => string }) => {
    console.log(data.toString())
  })
}

test('shows plugins when flag specified', async () => {
  const proc = spawn(
    'node',
    [
      '--loader',
      'ts-node/esm',
      '--es-module-specifier-resolution',
      'node',
      '--experimental-vm-modules',
      '--no-warnings',
      '../../bin/svgo.ts',
      '--no-color',
      '--show-plugins',
    ],
    { cwd: path.dirname(url.fileURLToPath(import.meta.url)) },
  )
  logProc(proc)
  const stdout = await waitStdout(proc)
  expect(stdout).toMatch(/Currently available plugins:/)
})

test('accepts svg as input stream', async () => {
  const proc = spawn(
    'node',
    [
      '--loader',
      'ts-node/esm',
      '--es-module-specifier-resolution',
      'node',
      '--experimental-vm-modules',
      '--no-warnings',
      '../../bin/svgo.ts',
      '--no-color',
      '-',
    ],
    {
      cwd: path.dirname(url.fileURLToPath(import.meta.url)),
    },
  )
  proc.stdin.write('<svg><title>stdin</title></svg>')
  proc.stdin.end()
  const stdout = await waitStdout(proc)
  expect(stdout).toEqual('<svg/>')
})

test('accepts svg as string', async () => {
  const input = '<svg><title>string</title></svg>'
  const proc = spawn(
    'node',
    [
      '--loader',
      'ts-node/esm',
      '--es-module-specifier-resolution',
      'node',
      '--experimental-vm-modules',
      '--no-warnings',
      '../../bin/svgo.ts',
      '--no-color',
      '--string',
      input,
    ],
    { cwd: path.dirname(url.fileURLToPath(import.meta.url)) },
  )
  const stdout = await waitStdout(proc)
  expect(stdout).toEqual('<svg/>')
})

test('accepts svg as filename', async () => {
  const proc = spawn(
    'node',
    [
      '--loader',
      'ts-node/esm',
      '--es-module-specifier-resolution',
      'node',
      '--experimental-vm-modules',
      '--no-warnings',
      '../../bin/svgo.ts',
      '--no-color',
      'single.svg',
      '-o',
      'output/single.svg',
    ],
    { cwd: path.dirname(url.fileURLToPath(import.meta.url)) },
  )
  await waitClose(proc)
  const output = fs.readFileSync(
    path.join(
      path.dirname(url.fileURLToPath(import.meta.url)),
      'output/single.svg',
    ),
    'utf8',
  )
  expect(output).toEqual('<svg/>')
})

test('output as stream when "-" is specified', async () => {
  const proc = spawn(
    'node',
    [
      '--loader',
      'ts-node/esm',
      '--es-module-specifier-resolution',
      'node',
      '--experimental-vm-modules',
      '--no-warnings',
      '../../bin/svgo.ts',
      '--no-color',
      'single.svg',
      '-o',
      '-',
    ],
    { cwd: path.dirname(url.fileURLToPath(import.meta.url)) },
  )
  logProc(proc)
  const stdout = await waitStdout(proc)
  expect(stdout).toEqual('<svg/>')
})

test('should exit with 1 code on syntax error', async () => {
  const proc = spawn(
    'node',
    [
      '--loader',
      'ts-node/esm',
      '--es-module-specifier-resolution',
      'node',
      '--experimental-vm-modules',
      '--no-warnings',
      '../../bin/svgo.ts',
      '--no-color',
      'invalid.svg',
    ],
    {
      cwd: path.dirname(url.fileURLToPath(import.meta.url)),
    },
  )
  logProc(proc)
  const [code, stderr] = await Promise.all([
    new Promise((resolve) => {
      proc.on('close', (code) => {
        resolve(code)
      })
    }),
    new Promise((resolve) => {
      proc.stderr.on('data', (error) => {
        resolve(error.toString())
      })
    }),
  ])
  expect(code).toEqual(1)
  expect(stderr)
    .toEqual(`SvgoParserError: invalid.svg:2:27: Unquoted attribute value

  1 | <svg>
> 2 |   <rect x="0" y="0" width=10" height="20" />
    |                           ^
  3 | </svg>
  4 | 

`)
})
