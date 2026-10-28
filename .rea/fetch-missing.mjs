import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const model = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const existing = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const dest = process.argv[4];

const known = new Set(Object.keys(existing));

const needed = new Set();
for (const sec of model.sections) {
  for (const n of sec.nodes) {
    for (const k of ['bgUrl', 'maskUrl', 'borderUrl']) {
      const u = n[k];
      if (u && !known.has(u)) needed.add(u);
    }
  }
}

const skipFrag = ['d234953c97a20f05', 'be9a053a77ec7cdb', '69ccff4bf9c533a8', 'a9e20124a7f7f741'];
const todo = [...needed].filter((u) => !skipFrag.some((f) => u.includes(f)));
console.log('need to download:', todo.length);

let n = 20;
const added = {};
for (const u of todo) {
  const name = `img-${String(n++).padStart(2, '0')}.webp`;
  const out = path.join(dest, name);
  try {
    const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await pipeline(res.body, fs.createWriteStream(out));
    added[u] = { name, dir: 'img' };
    console.log(`ok ${name} ${(fs.statSync(out).size / 1024).toFixed(0)}KB`);
  } catch (e) {
    console.log(`ERR ${name} ${e.message}`);
  }
}

fs.writeFileSync(process.argv[3], JSON.stringify({ ...existing, ...added }, null, 2), 'utf8');
console.log('asset-map updated:', Object.keys(existing).length + Object.keys(added).length, 'entries');
