import { visit } from '../xast.js';

/**
 * @typedef {import('../svgo.d.ts').BuiltinPlugin<string, Object>} BuiltinPlugin
 * @typedef {import('../svgo.d.ts').BuiltinPluginOrPreset<?, ?>} BuiltinPreset
 */

/**
 * Plugins engine.
 *
 * @module plugins
 *
 * @param {Object} ast input ast
 * @param {Object} info extra information
 * @param {BuiltinPlugin[]} plugins plugins object from config
 * @param {Record<string, Object>} overrides
 * @param {Object} globalOverrides
 */
export const invokePlugins = (
  ast,
  info,
  plugins,
  overrides,
  globalOverrides,
) => {
  for (const plugin of plugins) {
    const override = overrides?.[plugin.name];
    if (override === false) {
      continue;
    }
    // @ts-expect-error
    const params = { ...plugin.params, ...globalOverrides, ...override };
    // @ts-expect-error
    const visitor = plugin.fn(ast, params, info);
    if (visitor != null) {
      // @ts-expect-error
      visit(ast, visitor);
    }
  }
};

/**
 * @param {{ name: string, plugins: BuiltinPlugin[] }} arg0
 * @returns {BuiltinPreset}
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
