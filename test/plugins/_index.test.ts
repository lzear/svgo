import FS from 'node:fs'
import { EOL } from 'node:os'
import path from 'node:path'
import url from 'node:url'

import { optimize } from '../../lib/svgo'

const regEOL = new RegExp(EOL, 'g')
const regFilename = /^(.*)\.(\d+)\.svg$/

describe('plugins tests', function () {
  const files = FS.readdirSync(path.dirname(url.fileURLToPath(import.meta.url)))

  it.each(files)('%s', function (file) {
    const match = file.match(regFilename)
    if (match) {
      const name = match[1]

      file = path.resolve(
        path.dirname(url.fileURLToPath(import.meta.url)),
        file,
      )
      return readFile(file).then(function (data) {
        // remove description
        const items = normalize(data).split(/\s*===\s*/)
        const test = items.length === 2 ? items[1] : items[0]
        // extract test case
        const [original, should, params] = test.split(/\s*@@@\s*/)
        const plugin = {
          name,
          params: params ? JSON.parse(params) : {},
        }
        let lastResultData = original
        // test plugins idempotence
        const exclude = ['addAttributesToSVGElement', 'convertTransform']
        const multipass = exclude.includes(name) ? 1 : 2
        for (let i = 0; i < multipass; i += 1) {
          const result = optimize(lastResultData, {
            path: file,
            plugins: [plugin],
            js2svg: { pretty: true },
          })
          lastResultData = result.data
          expect(result.error).not.toEqual(expect.anything())
          //FIXME: results.data has a '\n' at the end while it should not
          expect(normalize(result.data)).toEqual(should)
        }
      })
    }
  })
})

function normalize(file) {
  return file.trim().replace(regEOL, '\n')
}

function readFile(file) {
  return new Promise(function (resolve, reject) {
    FS.readFile(file, 'utf8', function (err, data) {
      if (err) return reject(err)
      resolve(data)
    })
  })
}
