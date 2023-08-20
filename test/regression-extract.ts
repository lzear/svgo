'use strict';

import fs from 'fs';
import path from 'path';
import url from "node:url";
import util from 'util';
import zlib from 'zlib';
import stream from 'stream';
import fetch from 'node-fetch';
import tarStream from 'tar-stream';

const pipeline = util.promisify(stream.pipeline);

const extractTarGz = async (url, baseDir, include) => {
  const extract = tarStream.extract();
  extract.on('entry', async (header, stream, next) => {
    try {
      if (include == null || include.test(header.name)) {
        if (header.name.endsWith('.svg')) {
          const file = path.join(baseDir, header.name);
          await fs.promises.mkdir(path.dirname(file), { recursive: true });
          await pipeline(stream, fs.createWriteStream(file));
        }
        if (header.name.endsWith('.svgz')) {
          // .svgz -> .svg
          const file = path.join(baseDir, header.name.slice(0, -1));
          await fs.promises.mkdir(path.dirname(file), { recursive: true });
          await pipeline(
            stream,
            zlib.createGunzip(),
            fs.createWriteStream(file)
          );
        }
      }
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
    stream.resume();
    next();
  });
  const response = await fetch(url);
  await pipeline(response.body, extract);
};

(async () => {
  try {
    console.info('Download W3C SVG 1.1 Test Suite and extract svg files');
    await extractTarGz(
      'https://www.w3.org/Graphics/SVG/Test/20110816/archives/W3C_SVG_11_TestSuite.tar.gz',
      path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'regression-fixtures', 'w3c-svg-11-test-suite'),
      /^svg\//
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
