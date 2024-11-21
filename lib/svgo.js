import { parseSvg } from './parser.js';
import { builtin } from './builtin.js';
import { invokePlugins } from './svgo/plugins.js';
import { encodeSVGDatauri } from './svgo/tools.js';
import { VERSION } from './version.js';
import { querySelector, querySelectorAll } from './xast.js';
import _collections from '../plugins/_collections.js';
import { Stats } from './stats.ts';

/**
 * @typedef {import('./svgo.d.ts').BuiltinPluginOrPreset<?, ?>} BuiltinPluginOrPreset
 * @typedef {import('./svgo.d.ts').Config} Config
 * @typedef {import('./stats.js').StatsSummary} StatsSummary
 */

const pluginsMap = new Map();
for (const plugin of builtin) {
  pluginsMap.set(plugin.name, plugin);
}

/**
 * @param {string} name
 * @returns {BuiltinPluginOrPreset}
 */
function getPlugin(name) {
  if (name === 'removeScriptElement') {
    console.warn(
      'Warning: removeScriptElement has been renamed to removeScripts, please update your SVGO config',
    );
    return pluginsMap.get('removeScripts');
  }

  return pluginsMap.get(name);
}

const resolvePluginConfig = (plugin) => {
  if (typeof plugin === 'string') {
    // resolve builtin plugin specified as string
    const builtinPlugin = getPlugin(plugin);
    if (builtinPlugin == null) {
      throw Error(`Unknown builtin plugin "${plugin}" specified.`);
    }
    return {
      name: plugin,
      params: {},
      fn: builtinPlugin.fn,
    };
  }
  if (typeof plugin === 'object' && plugin != null) {
    if (plugin.name == null) {
      throw Error(`Plugin name must be specified`);
    }
    // use custom plugin implementation
    let fn = plugin.fn;
    if (fn == null) {
      // resolve builtin plugin implementation
      const builtinPlugin = getPlugin(plugin.name);
      if (builtinPlugin == null) {
        throw Error(`Unknown builtin plugin "${plugin.name}" specified.`);
      }
      fn = builtinPlugin.fn;
    }
    return {
      name: plugin.name,
      params: plugin.params,
      fn,
    };
  }
  return null;
};

export {
  VERSION,
  builtin as builtinPlugins,
  querySelector,
  querySelectorAll,
  _collections,
};

/**
 * @param {string} input
 * @param {Config} config
 * @returns {{data: string, stats: StatsSummary}}
 */
export const optimize = (input, config) => {
  if (config == null) {
    config = {};
  }
  if (typeof config !== 'object') {
    throw Error('Config should be an object');
  }
  const maxPassCount = config.multipass ? 10 : 1;
  let prevResultSize = Number.POSITIVE_INFINITY;
  let output = '';
  const info = {};
  if (config.path != null) {
    info.path = config.path;
  }
  let ast = parseSvg(input, config.path);
  const stats = new Stats(input, ast);
  for (let i = 0; i < maxPassCount; i += 1) {
    info.multipassCount = i;
    stats.incrementPasses();

    const plugins = config.plugins || ['preset-default'];
    if (!Array.isArray(plugins)) {
      throw Error(
        'malformed config, `plugins` property must be an array.\nSee more info here: https://github.com/svg/svgo#configuration',
      );
    }
    const resolvedPlugins = plugins
      .filter((plugin) => plugin != null)
      .map(resolvePluginConfig);

    if (resolvedPlugins.length < plugins.length) {
      console.warn(
        'Warning: plugins list includes null or undefined elements, these will be ignored.',
      );
    }
    const globalOverrides = {};
    if (config.floatPrecision != null) {
      globalOverrides.floatPrecision = config.floatPrecision;
    }
    invokePlugins(ast, info, resolvedPlugins, null, globalOverrides, stats);
    output = stats.stringify(ast, config.js2svg);
    if (output.length < prevResultSize) {
      input = output;
      prevResultSize = output.length;
    } else {
      break;
    }
    ast = parseSvg(input, config.path);
  }
  if (config.datauri) {
    output = encodeSVGDatauri(output, config.datauri);
  }
  return {
    data: output,
    stats: stats.getStatsSummary(),
  };
};

export default {
  VERSION,
  optimize,
  builtinPlugins: builtin,
  querySelector,
  querySelectorAll,
  _collections,
};
