import fs from 'node:fs';
import path from 'node:path';
import { pipeline } from 'node:stream/promises';

const urlsFile = process.argv[2];
const outRoot = process.argv[3];

const raw = fs.readFileSync(urlsFile, 'utf8');
const urls = [...raw.matchAll(/https?:\/\/\S+/g)]
  .map((m) => m[0].replace(/[,\s]+$/, ''))
  .filter((u) => !u.includes('maps.app.goo.gl') && !u.includes('facebook.com'));

const isFont = (u) => /\.ttf|\.otf|application\/octet-stream/.test(u);
const isAudio = (u) => /audio\/mpeg|\.mp3/.test(u);
const isCss = (u) => u.includes('api.webcake.io');
const isSvg = (u) => u.includes('.svg');

const manifest = {};
let n = 0;

for (const u of urls) {
  let rel;
  if (isCss(u)) rel = `vendor/${u.includes('animate') ? 'animatev4.css' : 'iconfont.css'}`;
  else if (isFont(u)) {
    const tag = u.includes('l:387951') ? 'thiep-6.ttf'
      : u.includes('l:66998') ? 'thiep-1.otf'
      : u.includes('l:198723') ? 'thiep-4.ttf'
      : u.includes('l:6925297') ? 'audio-19.mp3'
      : 'font-extra.ttf';
    rel = isAudio(u) ? 'audio/audio-19.mp3' : `fonts/${tag}`;
  } else if (isAudio(u)) rel = 'audio/audio-19.mp3';
  else if (isSvg(u)) rel = `img/svg-${n++}.svg`;
  else rel = `img/cdn-${n++}.webp`;

  const out = path.join(outRoot, rel);
  if (fs.existsSync(out) && fs.statSync(out).size > 0) {
    manifest[u] = rel;
    continue;
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  try {
    const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://e.ewedding.site/' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(out, buf);
    manifest[u] = rel;
    console.log(`ok  ${rel.padEnd(26)} ${(buf.length / 1024).toFixed(0)}KB`);
  } catch (e) {
    console.log(`ERR ${rel.padEnd(26)} ${e.message}`);
  }
}

fs.writeFileSync(path.join(outRoot, '..', 'asset-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('\nmanifest entries:', Object.keys(manifest).length);
