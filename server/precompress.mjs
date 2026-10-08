// Write a `.br` and a `.gz` sibling for every large compressible file under a directory, so the
// server can send them with Content-Encoding instead of compressing a 38 MB engine on every
// request. Run at image build (Dockerfile.godot); brotli at its highest quality takes about a
// minute for the Godot engine and cuts it from 38 MB to 6.5 MB on the wire.
//   node server/precompress.mjs build/web
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
import { ZIP } from './server.mjs';

const MIN = 1024;

export function precompress(root, log = () => {}) {
  const out = [];
  for (const name of readdirSync(root)) {
    const file = path.join(root, name);
    const st = statSync(file);
    if (st.isDirectory()) { out.push(...precompress(file, log)); continue; }
    if (!ZIP.has(path.extname(file)) || st.size <= MIN) continue;
    const data = readFileSync(file);
    const br = brotliCompressSync(data, { params: { [constants.BROTLI_PARAM_QUALITY]: 11, [constants.BROTLI_PARAM_SIZE_HINT]: data.length } });
    const gz = gzipSync(data, { level: 9 });
    writeFileSync(file + '.br', br);
    writeFileSync(file + '.gz', gz);
    log(`${path.relative(root, file)}: ${data.length} → br ${br.length}, gz ${gz.length}`);
    out.push({ file, size: data.length, br: br.length, gz: gz.length });
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2] || 'build/web';
  const t = Date.now();
  const done = precompress(root, (l) => console.log(l));
  console.log(`${done.length} files precompressed in ${((Date.now() - t) / 1000).toFixed(1)} s`);
}
