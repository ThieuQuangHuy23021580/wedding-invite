const fs = require('fs');
const WS = process.argv[2];
const OUT = process.argv[3];

const ws = new WebSocket(WS);
let id = 0;
const pending = new Map();
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    if (msg.error) reject(new Error(JSON.stringify(msg.error)));
    else resolve(msg.result);
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const msgId = ++id;
    pending.set(msgId, { resolve, reject });
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}

const expr = `(() => {
  const out = { fonts: [], rules: [], sheets: [] };
  for (const sh of document.styleSheets) {
    let rules;
    try { rules = sh.cssRules; } catch (e) { out.sheets.push({ href: sh.href, err: 'CORS' }); continue; }
    out.sheets.push({ href: sh.href, n: rules.length });
    for (const r of rules) {
      if (r.type === 5) {
        out.fonts.push({ family: r.style.fontFamily, weight: r.style.fontWeight, src: (r.style.src||'').slice(0,220) });
      }
    }
  }
  const sel = ['#w-es5t2vbw', '#w-busqx5pl', '#w-3gqkr7q8', '#w-c4npnjmv', '#w-eu6zrsxi', '#w-mnwzt5oq', '#w-moefqb14', '#w-lm5j4vvh', '#w-3va4ksjp', '#w-yhfl89fs', '#w-44fh0kb7', '#w-rtnweimd', '#w-6uumx4vy', '.com-image-block', '.image-background', '.image-block-css', '.image-gradient-border', '.com-text-block', '.text-block-css', '.group-auto-scroll', '.group-container', '.section-container', '.section-wrapper', '.section-background'];
  for (const s of sel) {
    const el = document.querySelector(s);
    if (!el) { out.rules.push({ sel: s, missing: true }); continue; }
    const cs = getComputedStyle(el);
    const dump = {};
    ['position','top','left','right','bottom','width','height','transform','transformOrigin','backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','borderRadius','boxShadow','filter','opacity','zIndex','overflow','display','fontFamily','fontSize','lineHeight','letterSpacing','color','fontWeight','textAlign','aspectRatio','justifyContent','alignItems','background'].forEach(p => { dump[p] = cs[p]; });
    out.rules.push({ sel: s, style: JSON.stringify(el.getAttribute('style') || ''), cls: (el.className||'').toString(), computed: dump });
  }
  return out;
})()`;

ws.addEventListener('open', async () => {
  try {
    await send('Runtime.enable');
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    fs.writeFileSync(OUT, JSON.stringify(r.result.value, null, 2), 'utf8');
    const v = r.result.value;
    console.log('SHEETS:', JSON.stringify(v.sheets, null, 1));
    console.log('FONTS:', JSON.stringify(v.fonts, null, 1));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
