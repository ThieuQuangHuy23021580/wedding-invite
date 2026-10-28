import fs from 'node:fs';
import path from 'node:path';

const OUT = process.argv[2];
const manifest = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const body = fs.readFileSync(process.argv[4], 'utf8');
const styles = fs.readFileSync(process.argv[5], 'utf8');
const assetsRoot = process.argv[6];

const relOf = (url) => {
  const clean = url.replace(/&quot;$/, '').replace(/&amp;$/, '');
  if (manifest[clean]) return '/' + manifest[clean].replace(/\\/g, '/');
  if (manifest[url]) return '/' + manifest[url].replace(/\\/g, '/');
  return null;
};

const rewrite = (text) =>
  text.replace(/https?:\/\/[^\s"')]+/g, (url) => relOf(url) || url);

const cssOut = rewrite(styles);
const htmlOut = rewrite(body);

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'layout.css'), cssOut, 'utf8');

const faces = [
  ['KD-Aureligena-Script.ttf', 'fonts/thiep-6.ttf', 'truetype'],
  ['thiep 1.otf', 'fonts/thiep-1.otf', 'opentype'],
  ['thiep 4.ttf', 'fonts/thiep-4.ttf', 'truetype'],
  ['thiep 6.ttf', 'fonts/thiep-6.ttf', 'truetype'],
];
fs.writeFileSync(
  path.join(OUT, 'fonts.css'),
  faces
    .map(
      ([fam, file, fmt]) =>
        `@font-face{font-family:"${fam}";src:url("/${assetsRoot}/${file}") format("${fmt}");font-display:swap;}`
    )
    .join('\n'),
  'utf8'
);

const remaining = [...new Set([...htmlOut.matchAll(/https?:\/\/[^\s"')]+/g)].map((m) => m[0]))];
fs.writeFileSync(path.join(OUT, 'remaining-urls.txt'), remaining.join('\n'), 'utf8');

console.log('layout.css:', cssOut.length, 'bytes');
console.log('body:', htmlOut.length, 'bytes');
console.log('remaining external:', remaining.length);
remaining.forEach((u) => console.log('  ' + u));
