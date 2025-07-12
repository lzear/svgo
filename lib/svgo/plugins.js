import { visit } from '../util/visit.js';

/**
 * @typedef {import('../svgo.d.ts').BuiltinPlugin<string, Object>} BuiltinPlugin
 * @typedef {import('../svgo.d.ts').BuiltinPluginOrPreset<?, ?>} BuiltinPreset
 * @typedef {import('../types.js').XastRoot} XastRoot
 * @typedef {import('../types.js').PluginInfo} PluginInfo
 * @typedef {import('../stats.ts').Stats} Stats
 */

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {XastRoot} ast input ast
 * @param {PluginInfo} info extra information
 * @param {ReadonlyArray<any>} plugins Plugins property from config.
 * @param {Record<string, Object>|null} overrides
 * @param {Object} globalOverrides
 * @param {Stats?} [stats]
 */
export const invokePlugins = (
  ast,
  info,
  plugins,
  overrides,
  globalOverrides,
  stats,
) => {
  for (const plugin of plugins) {
    const override = overrides?.[plugin.name];
    if (override === false) {
      continue;
    }
    const params = { ...plugin.params, ...globalOverrides, ...override };

    const visitor = plugin.fn(ast, params, info);
    if (visitor != null) {
      if (stats) {
        stats.visit(ast, visitor, plugin);
      } else {
        visit(ast, visitor);
      }
    }
  }
};

/**
 * @template {string} T
 * @param {{ name: T, plugins: ReadonlyArray<import('../types.js').BuiltinPlugin<string, any>> }} arg0
 * @returns {import('../types.js').BuiltinPluginOrPreset<T, any>}
 */
export const createPreset = ({ name, plugins }) => {
  return {
    name,
    isPreset: true,
    plugins: Object.freeze(plugins),
    fn: (ast, params, info) => {
      const { floatPrecision, overrides } = params;
      const globalOverrides = {};
      if (floatPrecision != null) {
        globalOverrides.floatPrecision = floatPrecision;
      }
      if (overrides) {
        const pluginNames = plugins.map(({ name }) => name);
        for (const pluginName of Object.keys(overrides)) {
          if (!pluginNames.includes(pluginName)) {
            console.warn(
              `You are trying to configure ${pluginName} which is not part of ${name}.\n` +
                `Try to put it before or after, for example\n\n` +
                `plugins: [\n` +
                `  {\n` +
                `    name: '${name}',\n` +
                `  },\n` +
                `  '${pluginName}'\n` +
                `]\n`,
            );
          }
        }
      }
      invokePlugins(ast, info, plugins, overrides, globalOverrides);
    },
  };
};
