const fs = require('fs');
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const secH = rows[0].box[3];
console.log('SEC', rows[0].box);
const W = rows[0].box[2];
console.log('scale127 =', (W / 127).toFixed(5));
for (const r of rows) {
  const indent = '  '.repeat(r.d);
  const pctX = (r.box[0] / W * 100).toFixed(2);
  const pctY = (r.box[1] / secH * 100).toFixed(2);
  const pctW = (r.box[2] / W * 100).toFixed(2);
  const pctH = (r.box[3] / secH * 100).toFixed(2);
  const tf = r.tf !== 'none' ? r.tf : '';
  let rot = '';
  const m = tf.match(/matrix\(([^)]+)\)/);
  if (m) {
    const [a, b] = m[1].split(',').map(Number);
    rot = ` rot=${(Math.atan2(b, a) * 180 / Math.PI).toFixed(2)}deg`;
  }
  const bg = r.bg.startsWith('url') ? 'BG' : '';
  console.log(`${indent}${r.tag}.${r.cls.slice(0,26)} box=[${r.box}] pct=[${pctX},${pctY},${pctW},${pctH}] base=[${r.base}] inset=[${r.inset}] ${bg} ${rot} op=${r.opacity} z=${r.z} rad=${r.radius==='0px'?'':r.radius} ${r.fontFamily!=='Roboto'?`F=${r.fontFamily} ${r.fontSize}/${r.lh} ls=${r.ls} fw=${r.fw} col=${r.color} ta=${r.textAlign}`:''}`);
}
