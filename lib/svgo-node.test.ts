/**
 * @typedef {import('../lib/types').Plugin} Plugin
 */

import os from 'os';
import path from 'path';
import { optimize, loadConfig } from './svgo-node';
import url from "node:url";

const describeLF = os.EOL === '\r\n' ? describe.skip : describe;
const describeCRLF = os.EOL === '\r\n' ? describe : describe.skip;

describeLF('with LF line-endings', () => {
  test('should work', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg);
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="red"/></svg>'
    );
  });

  test('should respect config', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\n  <circle cx="60" cy="60" r="50" fill="red"/>\n</svg>\n'
    );
  });

  test('should respect line-ending config', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { eol: 'crlf', pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\r\n  <circle cx="60" cy="60" r="50" fill="red"/>\r\n</svg>\r\n'
    );
  });
});

describeCRLF('with CRLF line-endings', () => {
  test('should work', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg);
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="red"/></svg>'
    );
  });

  test('should respect config', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\r\n  <circle cx="60" cy="60" r="50" fill="red"/>\r\n</svg>\r\n'
    );
  });

  test('should respect line-ending config', () => {
    const svg = `
      <?xml version="1.0" encoding="utf-8"?>
      <svg viewBox="0 0 120 120">
        <desc>
          Not standard description
        </desc>
        <circle fill="#ff0000" cx="60" cy="60" r="50"/>
      </svg>
    `;
    const { data } = optimize(svg, {
      js2svg: { eol: 'lf', pretty: true, indent: 2 },
    });
    // using toEqual because line endings matter in these tests
    expect(data).toEqual(
      '<svg viewBox="0 0 120 120">\n  <circle fill="red" cx="60" cy="60" r="50"/>\n</svg>\n'
    );
  });
});

describe('loadConfig', () => {
  const cwd = process.cwd();
  const fixtures = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '../test/fixtures/config-loader');

  test('loads by absolute path', async () => {
    expect(await loadConfig(path.join(fixtures, 'one/two/config'))).toEqual({
      plugins: [],
    });
  });

  test('loads by relative path to cwd', async () => {
    const config = await loadConfig('one/two/config', fixtures);
    expect(config).toEqual({ plugins: [] });
  });

  test('searches in cwd and up', async () => {
    expect(await loadConfig(null, path.join(fixtures, 'one/two'))).toEqual({
      plugins: [],
    });
    expect(
      await loadConfig(null, path.join(cwd, './test/fixtures/missing'))
    ).toEqual(null);
    expect(await loadConfig(null, path.join(fixtures, 'mjs'))).toEqual({
      plugins: ['mjs'],
    });
    expect(await loadConfig(null, path.join(fixtures, 'cjs'))).toEqual({
      plugins: ['cjs'],
    });
  });

  test('fails when specified config does not exist', async () => {
    try {
      await loadConfig('{}');
      expect.fail('Config is loaded successfully');
    } catch (error) {
      expect(error.message).toMatch(/Cannot find module/);
    }
  });

  test('fails when exported config not an object', async () => {
    try {
      await loadConfig(path.join(fixtures, 'invalid-null'));
      expect.fail('Config is loaded successfully');
    } catch (error) {
      expect(error.message).toMatch(/Invalid config file/);
    }
    try {
      await loadConfig(path.join(fixtures, 'invalid-array'));
      expect.fail('Config is loaded successfully');
    } catch (error) {
      expect(error.message).toMatch(/Invalid config file/);
    }
    try {
      await loadConfig(path.join(fixtures, 'invalid-string'));
      expect.fail('Config is loaded successfully');
    } catch (error) {
      expect(error.message).toMatch(/Invalid config file/);
    }
  });

  test('handles runtime errors properly', async () => {
    try {
      await loadConfig(path.join(fixtures, 'invalid-runtime'));
      expect.fail('Config is loaded successfully');
    } catch (error) {
      expect(error.message).toMatch(/plugins is not defined/);
    }
    try {
      await loadConfig(path.join(fixtures, 'invalid-runtime.mjs'));
      expect.fail('Config is loaded successfully');
    } catch (error) {
      expect(error.message).toMatch(/plugins is not defined/);
    }
  });

  test('handles MODULE_NOT_FOUND properly', async () => {
    try {
      await loadConfig(path.join(fixtures, 'module-not-found'));
      expect.fail('Config is loaded successfully');
    } catch (error) {
      expect(error.message).toMatch(/Cannot find module 'unknown-module'/);
    }
  });
});
