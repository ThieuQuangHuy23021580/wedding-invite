import fs from 'node:fs';

const css = fs.readFileSync(process.argv[2], 'utf8');
const html = fs.readFileSync(process.argv[3], 'utf8');
const all = css + '\n' + html;

const urlRe = /url\((["']?)(https?:\/\/[^"')]+)\1\)/g;
const hrefRe = /(?:src|href)=(["'])(https?:\/\/[^"']+)\1/g;

const urls = new Set();
let m;
while ((m = urlRe.exec(all))) urls.add(m[2]);
while ((m = hrefRe.exec(all))) urls.add(m[2]);

const byHost = {};
for (const u of urls) {
  const host = new URL(u).host;
  (byHost[host] ||= []).push(u);
}

for (const [host, list] of Object.entries(byHost)) {
  console.log(`\n### ${host} (${list.length})`);
  list.forEach((u) => console.log('  ' + u));
}
