const fs = require('fs');
const WS = process.argv[2];
const SEL = process.argv[3];
const OUT = process.argv[4];

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
      const sec = document.querySelector(${JSON.stringify(SEL)});
      const sr = sec.getBoundingClientRect();
      const out = [];
      function walk(el, d) {
        const cs = getComputedStyle(el);
        if (cs.display === 'none') return;
        const r = el.getBoundingClientRect();
        out.push({
          d,
          tag: el.tagName.toLowerCase(),
          cls: (el.className||'').toString(),
          styleAttr: el.getAttribute('style') || '',
          box: [ +(r.left-sr.left).toFixed(1), +(r.top-sr.top).toFixed(1), +r.width.toFixed(1), +r.height.toFixed(1) ],
          base: [cs.width, cs.height],
          inset: [cs.top, cs.right, cs.bottom, cs.left],
          tf: cs.transform,
          tfOrigin: cs.transformOrigin,
          bg: cs.backgroundImage.startsWith('url') ? cs.backgroundImage.slice(0,60) : cs.backgroundImage.slice(0,60),
          bgSize: cs.backgroundSize,
          bgPos: cs.backgroundPosition,
          bgClip: cs.backgroundClip,
          radius: cs.borderRadius,
          shadow: cs.boxShadow,
          opacity: cs.opacity,
          z: cs.zIndex,
          overflow: cs.overflow,
          pos: cs.position,
          border: cs.border,
          mixBlend: cs.mixBlendMode,
          filter: cs.filter,
          maskImage: cs.maskImage !== 'none' ? cs.maskImage.slice(0,50) : 'none',
          fontFamily: cs.fontFamily.split(',')[0],
          fontSize: cs.fontSize,
          color: cs.color,
          ls: cs.letterSpacing,
          lh: cs.lineHeight,
          fw: cs.fontWeight,
          fontStyle: cs.fontStyle,
          textAlign: cs.textAlign,
        });
        [...el.children].forEach(c => walk(c, d+1));
      }
      walk(sec, 0);
      return out;
    })()`;
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
    fs.writeFileSync(OUT, JSON.stringify(r.result.value, null, 2), 'utf8');
    console.log('rows', r.result.value.length);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
