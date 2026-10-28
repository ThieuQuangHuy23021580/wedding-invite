import fs from 'node:fs';
import path from 'node:path';

const manifestPath = process.argv[2];
const assetsRoot = process.argv[3];

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

const byHash = new Map();
for (const [url, rel] of Object.entries(manifest)) {
  const m = url.match(/([0-9a-f]{32,})/);
  if (!m) continue;
  const full = path.join(assetsRoot, rel);
  const size = fs.existsSync(full) ? fs.statSync(full).size : Infinity;
  const h = m[1].slice(0, 12);
  if (!byHash.has(h) || size < byHash.get(h).size) byHash.set(h, { rel, size });
}

const out = Object.assign({}, manifest);
let freed = 0;
let mapped = 0;

for (const [url, rel] of Object.entries(manifest)) {
  const m = url.match(/([0-9a-f]{32,})/);
  if (!m) continue;
  const alt = byHash.get(m[1].slice(0, 12));
  if (!alt || alt.rel === rel) continue;

  const big = path.join(assetsRoot, rel);
  const bigSize = fs.existsSync(big) ? fs.statSync(big).size : 0;
  if (bigSize <= 900 * 1024) continue;

  out[url] = alt.rel;
  fs.unlinkSync(big);
  freed += bigSize;
  mapped++;
}

fs.writeFileSync(manifestPath, JSON.stringify(out, null, 2), 'utf8');
console.log('mapped ' + mapped + ' urls to smaller copies, freed ' + (freed / 1024 / 1024).toFixed(1) + ' MB');
