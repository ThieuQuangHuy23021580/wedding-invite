import fs from 'node:fs';
import path from 'node:path';

const manifestPath = process.argv[2];
const assetsRoot = process.argv[3];
const cssPath = process.argv[4];

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const css = fs.readFileSync(cssPath, 'utf8');

// The WebCake layout CSS pairs a content URL with a statics (.fb) URL for the
// same asset. Pair them by their shared 12-char hash prefix.
const urlRe = /url\((https?:\/\/[^)"]+)\)/g;
let m;
const all = [];
while ((m = urlRe.exec(css))) all.push(m[1]);

const hash12 = (u) => {
  const h = u.match(/[0-9a-f]{32,}/);
  return h ? h[0].slice(0, 12) : null;
};

const byHash = new Map();
for (const [url, rel] of Object.entries(manifest)) {
  const h = hash12(url);
  if (h && rel.startsWith('img/')) {
    const full = path.join(assetsRoot, rel);
    const size = fs.existsSync(full) ? fs.statSync(full).size : Infinity;
    if (!byHash.has(h) || size < byHash.get(h).size) byHash.set(h, { rel, size });
  }
}

const out = Object.assign({}, manifest);
let mapped = 0;
let freed = 0;

for (const url of all) {
  if (!url.startsWith('https://statics.pancake.vn/')) continue;
  const h = hash12(url);
  const alt = h && byHash.get(h);
  if (!alt) continue;
  if (alt.rel === manifest[url]) continue;

  const big = path.join(assetsRoot, manifest[url]);
  const bigSize = fs.existsSync(big) ? fs.statSync(big).size : 0;
  out[url] = alt.rel;
  if (bigSize > 900 * 1024 && fs.existsSync(big)) {
    fs.unlinkSync(big);
    freed += bigSize;
    mapped++;
  }
}

fs.writeFileSync(manifestPath, JSON.stringify(out, null, 2), 'utf8');
console.log('mapped ' + mapped + ' statics urls to smaller local copies, freed ' + (freed / 1024 / 1024).toFixed(1) + ' MB');
