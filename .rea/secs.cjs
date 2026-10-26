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

ws.addEventListener('open', async () => {
  try {
    await send('Runtime.enable');
    const expr = `(() => {
      const secs = [...document.querySelectorAll('.com-section, section')];
      const uniq = [];
      const seen = new Set();
      for (const s of secs) { if (!seen.has(s) && s.getBoundingClientRect().height > 60) { seen.add(s); uniq.push(s); } }
      const y = window.scrollY;
      return uniq.map((s, i) => {
        const r = s.getBoundingClientRect();
        const cs = getComputedStyle(s);
        return {
          i,
          id: s.id,
          cls: (s.className||'').toString(),
          top: Math.round(r.top + y),
          h: Math.round(r.height),
          w: Math.round(r.width),
          bg: cs.backgroundColor,
          bgImg: cs.backgroundImage !== 'none' ? cs.backgroundImage.slice(0,70) : '',
          children: [...s.querySelectorAll('*')].length,
        };
      });
    })()`;
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    fs.writeFileSync(OUT, JSON.stringify(r.result.value, null, 2), 'utf8');
    r.result.value.forEach(v => console.log(`${v.i} #${v.id} .${v.cls.slice(0,40)} top=${v.top} h=${v.h} w=${v.w} bg=${v.bg} n=${v.children}`));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
