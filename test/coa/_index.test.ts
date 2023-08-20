import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

import { Command } from 'commander'
import del from 'del'

import * as svgo from '../../lib/svgo/coa'

const svgFolderPath = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  'testSvg',
)
const svgFolderPathRecursively = path.resolve(
  path.dirname(url.fileURLToPath(import.meta.url)),
  'testSvgRecursively',
)
const svgFiles = [
  path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    'testSvg/test.svg',
  ),
  path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    'testSvg/test.1.svg',
  ),
]
const tempFolder = 'temp'
const noop = () => {}

const { checkIsDir } = svgo

function runProgram(args) {
  const program = new Command()
  svgo.default(program)
  // prevent running process.exit
  program.exitOverride(() => {})
  // parser skips first two arguments
  return program.parseAsync([0, 1, ...args])
}

describe('coa', function () {
  beforeEach(async () => {
    await del(tempFolder)
    await fs.promises.mkdir(tempFolder)
  })

  afterAll(async () => {
    await del(tempFolder)
  })

  const initialConsoleError = global.console.error
  const initialProcessExit = global.process.exit

  function replaceConsoleError() {
    global.process.exit = noop
  }

  function restoreConsoleError() {
    global.console.error = initialConsoleError
    global.process.exit = initialProcessExit
  }

  function calcFolderSvgWeight(folderPath) {
    return fs
      .readdirSync(folderPath)
      .reduce(
        (initWeight, name) =>
          initWeight +
          (/.svg/.test(name)
            ? fs.statSync(path.join(folderPath, name)).size
            : 0) +
          (checkIsDir(path.join(folderPath, name))
            ? calcFolderSvgWeight(path.join(folderPath, name))
            : 0),
        0,
      )
  }

  it('should optimize folder', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPath)
    await runProgram([
      '--folder',
      svgFolderPath,
      '--output',
      tempFolder,
      '--quiet',
    ])
    const optimizedWeight = calcFolderSvgWeight(svgFolderPath)
    expect(optimizedWeight).toBeGreaterThan(0)
    expect(initWeight).toBeLessThanOrEqual(optimizedWeight)
  })

  it('should optimize folder recursively', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPathRecursively)
    await runProgram([
      '--folder',
      svgFolderPathRecursively,
      '--output',
      tempFolder,
      '--quiet',
      '--recursive',
    ])
    const optimizedWeight = calcFolderSvgWeight(svgFolderPathRecursively)
    expect(optimizedWeight).toBeGreaterThan(0)
    expect(initWeight).toBeLessThanOrEqual(optimizedWeight)
  })

  it('should optimize several files', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPath)
    await runProgram([
      '--input',
      ...svgFiles,
      '--output',
      tempFolder,
      '--quiet',
    ])
    const optimizedWeight = calcFolderSvgWeight(tempFolder)
    expect(optimizedWeight).toBeGreaterThan(0)
    expect(optimizedWeight).toBeLessThanOrEqual(initWeight)
    await del('temp.svg')
  })

  it('should optimize folder, when it stated in input', async () => {
    const initWeight = calcFolderSvgWeight(svgFolderPath)
    await runProgram([
      '--input',
      svgFolderPath,
      '--output',
      tempFolder,
      '--quiet',
    ])
    const optimizedWeight = calcFolderSvgWeight(svgFolderPath)
    expect(optimizedWeight).toBeLessThanOrEqual(initWeight)
  })

  it('should throw error when stated in input folder does not exist', async () => {
    replaceConsoleError()
    try {
      await runProgram([
        '--input',
        svgFolderPath + 'temp',
        '--output',
        tempFolder,
      ])
    } catch (error) {
      restoreConsoleError()
      expect(error.message).toMatch(/no such file or directory/)
    }
  })

  describe('stdout', () => {
    it('should show message when the folder is empty', async () => {
      const emptyFolderPath = path.resolve(
        path.dirname(url.fileURLToPath(import.meta.url)),
        'testSvgEmpty',
      )
      if (!fs.existsSync(emptyFolderPath)) {
        fs.mkdirSync(emptyFolderPath)
      }
      try {
        await runProgram(['--folder', emptyFolderPath, '--quiet'])
      } catch (error) {
        expect(error.message).toMatch(/No SVG files/)
      }
    })

    it('should show message when folder does not consists any svg files', async () => {
      try {
        await runProgram([
          '--folder',
          path.resolve(
            path.dirname(url.fileURLToPath(import.meta.url)),
            'testFolderWithNoSvg',
          ),
          '--quiet',
        ])
      } catch (error) {
        expect(error.message).toMatch(/No SVG files have been found/)
      }
    })
  })
})
