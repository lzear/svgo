// @ts-nocheck

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { optimize as optimizeAgnostic } from './svgo'

const importConfig = async (configFile) => {
  let config
  // at the moment dynamic import may randomly fail with segfault
  // to workaround this for some users .cjs extension is loaded
  // exclusively with require
  if (configFile.endsWith('.cjs')) {
    config = await import(configFile)
  } else {
    // dynamic import expects file url instead of path and may fail
    // when windows path is provided
    const { default: imported } = await import(pathToFileURL(configFile))
    config = imported
  }
  if (config == null || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(`Invalid config file "${configFile}"`)
  }
  return config
}

const isFile = async (file) => {
  try {
    const stats = await fs.promises.stat(file)
    return stats.isFile()
  } catch {
    return false
  }
}

export const loadConfig = async (configFile, cwd = process.cwd()) => {
  if (configFile != null) {
    return await (path.isAbsolute(configFile)
      ? importConfig(configFile)
      : importConfig(path.join(cwd, configFile)))
  }
  let dir = cwd
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const js = path.join(dir, 'svgo.config')
    if (await isFile(js)) {
      return await importConfig(js)
    }
    const mjs = path.join(dir, 'svgo.config.mjs')
    if (await isFile(mjs)) {
      return await importConfig(mjs)
    }
    const cjs = path.join(dir, 'svgo.config.cjs')
    if (await isFile(cjs)) {
      return await importConfig(cjs)
    }
    const parent = path.dirname(dir)
    if (dir === parent) {
      return null
    }
    dir = parent
  }
}

export const optimize = (input, config) => {
  if (config == null) {
    config = {}
  }
  if (typeof config !== 'object') {
    throw new TypeError('Config should be an object')
  }
  return optimizeAgnostic(input, {
    ...config,
    js2svg: {
      // platform specific default for end of line
      eol: os.EOL === '\r\n' ? 'crlf' : 'lf',
      ...config.js2svg,
    },
  })
}
