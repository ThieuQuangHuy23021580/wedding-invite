import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const manifestPath = process.argv[2];
const assetsRoot = process.argv[3];
const remainingFile = process.argv[4];

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const remaining = fs
  .readFileSync(remainingFile, 'utf8')
  .split('\n')
  .map((s) => s.trim().replace(/&quot;$/, ''))
  .filter((s) => /^https?:\/\//.test(s))
  .filter((s) => !s.includes('maps.app.goo.gl') && !s.includes('facebook.com'));

let n = 100;
const added = {};

for (const u of remaining) {
  if (manifest[u]) continue;
  const isSvg = u.includes('.svg');
  const rel = isSvg ? `img/extra-${n++}.svg` : `img/extra-${n++}.webp`;
  const out = path.join(assetsRoot, rel);
  try {
    const res = await fetch(u, {
      headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://e.ewedding.site/' },
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(out, buf);
    added[u] = rel;
    console.log('ok  ' + rel.padEnd(20) + (buf.length / 1024).toFixed(0) + 'KB');
  } catch (e) {
    console.log('ERR ' + rel.padEnd(20) + e.message + '  ' + u.slice(-40));
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(Object.assign({}, manifest, added), null, 2), 'utf8');
console.log('added', Object.keys(added).length);
