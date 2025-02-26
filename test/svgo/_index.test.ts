import fs from 'node:fs'
import { EOL } from 'node:os'
import path from 'node:path'
import url from 'node:url'

import { optimize } from '../../lib/svgo'

const regEOL = new RegExp(EOL, 'g')

const normalize = (file) => {
  return file.trim().replace(regEOL, '\n')
}

const parseFixture = async (file) => {
  const filepath = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    file,
  )
  const content = await fs.promises.readFile(filepath, 'utf8')
  return normalize(content).split(/\s*@@@\s*/)
}

describe('svgo', () => {
  it('should create indent with 2 spaces', async () => {
    const [original, expected] = await parseFixture('test.svg')
    const result = optimize(original, {
      plugins: [],
      js2svg: { pretty: true, indent: 2 },
    })
    expect(normalize(result.data)).toEqual(expected)
  })
  it('should handle plugins order properly', async () => {
    const [original, expected] = await parseFixture('plugins-order.svg')
    const result = optimize(original, { input: 'file', path: 'input.svg' })
    expect(normalize(result.data)).toEqual(expected)
  })
  it('should handle empty svg tag', async () => {
    const result = optimize('<svg />', { input: 'file', path: 'input.svg' })
    expect(result.data).toEqual('<svg/>')
  })
  it('should preserve style specifity over attributes', async () => {
    const [original, expected] = await parseFixture('style-specifity.svg')
    const result = optimize(original, {
      input: 'file',
      path: 'input.svg',
      js2svg: { pretty: true },
    })
    expect(normalize(result.data)).toEqual(expected)
  })
  it('should inline entities', async () => {
    const [original, expected] = await parseFixture('entities.svg')
    const result = optimize(original, {
      path: 'input.svg',
      plugins: [],
      js2svg: { pretty: true },
    })
    expect(normalize(result.data)).toEqual(expected)
  })
  it('should preserve whitespaces between tspan tags', async () => {
    const [original, expected] = await parseFixture('whitespaces.svg')
    const result = optimize(original, {
      path: 'input.svg',
      js2svg: { pretty: true },
    })
    expect(normalize(result.data)).toEqual(expected)
  })
})
