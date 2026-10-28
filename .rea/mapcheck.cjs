const fs = require('fs');
const path = require('path');

const MODEL = process.argv[2];
const ASSETMAP = process.argv[3];

const model = JSON.parse(fs.readFileSync(MODEL, 'utf8'));
const assetMap = JSON.parse(fs.readFileSync(ASSETMAP, 'utf8'));

// URL -> "img/img-00.webp"
const urlToLocal = {};
for (const [url, info] of Object.entries(assetMap)) {
  urlToLocal[url] = `${info.dir}/${info.name}`;
}

const extra = {
  'https://content.pancake.vn/1/fwebp90/63/9e/fc/73/d234953c97a20f05f071a057a6aa90497843a634f9f2be8df6d9d7fc-w:640-h:1136-l:735352-t:image/png.png': 'img/texture-paper.webp',
  'https://content.pancake.vn/1/08/3f/7a/e9/be9a053a77ec7cdb461246a62779525962247b7146d4dcccce9c1cfb.png': 'img/social-1.png',
  'https://content.pancake.vn/1/be/ad/61/25/69ccff4bf9c533a8297ad940b8f871b8bc7057593d2ec6f7d9c9066b.png': 'img/social-2.png',
  'https://content.pancake.vn/1/de/96/e1/6c/a9e20124a7f7f7418ba5112ef7a2f82d1967983b21065c77895a7f10.png': 'img/social-3.png',
};
Object.assign(urlToLocal, extra);

const used = new Map();
const missing = new Set();

for (const sec of model.sections) {
  for (const n of sec.nodes) {
    for (const key of ['bgUrl', 'maskUrl', 'borderUrl']) {
      const u = n[key];
      if (!u) continue;
      const local = urlToLocal[u];
      if (local) used.set(u, local);
      else missing.add(u);
    }
  }
}

console.log('=== mapped URLs ===');
[...used.entries()].forEach(([u, l]) => console.log(`  ${l.padEnd(28)} <- ${u.slice(-46)}`));
console.log('\n=== MISSING ===');
[...missing].forEach((u) => console.log('  ' + u));
