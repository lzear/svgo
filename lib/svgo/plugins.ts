// @ts-nocheck

import { visit } from '../xast'

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {Object} ast input ast
 * @param {Object} info extra information
 * @param {Array} plugins plugins object from config
 * @return {Object} output ast
 */
export const invokePlugins = (
  ast,
  info,
  plugins,
  overrides,
  globalOverrides,
) => {
  for (const plugin of plugins) {
    const override = overrides == null ? null : overrides[plugin.name]
    if (override === false) {
      continue
    }
    const params = { ...plugin.params, ...globalOverrides, ...override }

    const visitor = plugin.fn(ast, params, info)
    if (visitor != null) {
      visit(ast, visitor)
    }
  }
}

export const createPreset = ({ name, plugins }) => {
  return {
    name,
    fn: (ast, params, info) => {
      const { floatPrecision, overrides } = params
      const globalOverrides = {}
      if (floatPrecision != null) {
        globalOverrides.floatPrecision = floatPrecision
      }
      if (overrides) {
        const pluginNames = new Set(plugins.map(({ name }) => name))
        for (const pluginName of Object.keys(overrides)) {
          if (!pluginNames.has(pluginName)) {
            console.warn(
              `You are trying to configure ${pluginName} which is not part of ${name}.\n` +
                `Try to put it before or after, for example\n\n` +
                `plugins: [\n` +
                `  {\n` +
                `    name: '${name}',\n` +
                `  },\n` +
                `  '${pluginName}'\n` +
                `]\n`,
            )
          }
        }
      }
      invokePlugins(ast, info, plugins, overrides, globalOverrides)
    },
  }
}
