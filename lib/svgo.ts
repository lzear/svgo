// @ts-nocheck

import { invokePlugins } from './svgo/plugins'
import { encodeSVGDatauri } from './svgo/tools'
import { builtin } from './builtin'
import { parseSvg } from './parser'
import { stringifySvg } from './stringifier'

const pluginsMap = {}
for (const plugin of builtin) {
  pluginsMap[plugin.name] = plugin
}

const resolvePluginConfig = (plugin) => {
  if (typeof plugin === 'string') {
    // resolve builtin plugin specified as string
    const builtinPlugin = pluginsMap[plugin]
    if (builtinPlugin == null) {
      throw new Error(`Unknown builtin plugin "${plugin}" specified.`)
    }
    return {
      name: plugin,
      params: {},
      fn: builtinPlugin.fn,
    }
  }
  if (typeof plugin === 'object' && plugin != null) {
    if (plugin.name == null) {
      throw new Error(`Plugin name should be specified`)
    }
    // use custom plugin implementation
    let fn = plugin.fn
    if (fn == null) {
      // resolve builtin plugin implementation
      const builtinPlugin = pluginsMap[plugin.name]
      if (builtinPlugin == null) {
        throw new Error(`Unknown builtin plugin "${plugin.name}" specified.`)
      }
      fn = builtinPlugin.fn
    }
    return {
      name: plugin.name,
      params: plugin.params,
      fn,
    }
  }
  return null
}

export const optimize = (input, config) => {
  if (config == null) {
    config = {}
  }
  if (typeof config !== 'object') {
    throw new TypeError('Config should be an object')
  }
  const maxPassCount = config.multipass ? 10 : 1
  let prevResultSize = Number.POSITIVE_INFINITY
  let output = ''
  const info = {}
  if (config.path != null) {
    info.path = config.path
  }
  for (let i = 0; i < maxPassCount; i += 1) {
    info.multipassCount = i
    const ast = parseSvg(input, config.path)
    const plugins = config.plugins || ['preset-default']
    if (Array.isArray(plugins) === false) {
      throw new TypeError(
        "Invalid plugins list. Provided 'plugins' in config should be an array.",
      )
    }
    const resolvedPlugins = plugins.map(resolvePluginConfig)
    const globalOverrides = {}
    if (config.floatPrecision != null) {
      globalOverrides.floatPrecision = config.floatPrecision
    }
    invokePlugins(ast, info, resolvedPlugins, null, globalOverrides)
    output = stringifySvg(ast, config.js2svg)
    if (output.length < prevResultSize) {
      input = output
      prevResultSize = output.length
    } else {
      break
    }
  }
  if (config.datauri) {
    output = encodeSVGDatauri(output, config.datauri)
  }
  return {
    data: output,
  }
}
