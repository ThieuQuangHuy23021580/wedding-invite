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
      if (!sec) return { error: 'no section' };
      const sr = sec.getBoundingClientRect();
      const rows = [];
      let order = 0;

      function walk(el, path, depth) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        const bg = cs.backgroundImage;
        const m = bg.match(/url\\("?([^")]+)"?\\)/);
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
        rows.push({
          order: order++,
          depth,
          path,
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          cls: (el.className || '').toString(),
          x: +(r.left - sr.left).toFixed(1),
          y: +(r.top - sr.top).toFixed(1),
          w: +r.width.toFixed(1),
          h: +r.height.toFixed(1),
          transform: cs.transform !== 'none' ? cs.transform : undefined,
          rotate: cs.rotate !== 'none' ? cs.rotate : undefined,
          zIndex: cs.zIndex !== 'auto' ? cs.zIndex : undefined,
          opacity: cs.opacity !== '1' ? cs.opacity : undefined,
          bgImg: m ? m[1].split('/').slice(-1)[0] : undefined,
          bgFull: m ? m[1] : undefined,
          bgSize: m || bg.includes('gradient') ? cs.backgroundSize : undefined,
          bgPos: m ? cs.backgroundPosition : undefined,
          bgRepeat: m ? cs.backgroundRepeat : undefined,
          gradient: bg.includes('gradient') ? bg.slice(0, 140) : undefined,
          radius: cs.borderRadius !== '0px' ? cs.borderRadius : undefined,
          border: cs.borderTopWidth !== '0px' ? cs.border : undefined,
          boxShadow: cs.boxShadow !== 'none' ? cs.boxShadow : undefined,
          filter: cs.filter !== 'none' ? cs.filter : undefined,
          mixBlend: cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : undefined,
          overflow: cs.overflow !== 'visible' ? cs.overflow : undefined,
          text: hasText ? (el.innerText || '').trim().slice(0, 60) : undefined,
          font: hasText ? cs.fontFamily.split(',')[0].replace(/["']/g, '') : undefined,
          fontSize: hasText ? cs.fontSize : undefined,
          color: hasText ? cs.color : undefined,
          letterSpacing: hasText ? cs.letterSpacing : undefined,
          lineHeight: hasText ? cs.lineHeight : undefined,
        });
        [...el.children].forEach((c, i) => walk(c, path + '/' + i, depth + 1));
      }

      walk(sec, '', 0);
      return { h: Math.round(sr.height), count: rows.length, rows };
    })()`;

    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
    fs.writeFileSync(OUT, JSON.stringify(r.result.value, null, 2), 'utf8');
    const v = r.result.value;
    console.log(`h=${v.h} count=${v.count}`);
    v.rows.forEach((x) => {
      const pad = '  '.repeat(x.depth);
      const bits = [];
      if (x.bgImg) bits.push('img=' + x.bgImg);
      if (x.gradient) bits.push('grad');
      if (x.transform) bits.push('tf=' + x.transform);
      if (x.rotate) bits.push('rot=' + x.rotate);
      if (x.opacity) bits.push('op=' + x.opacity);
      if (x.zIndex) bits.push('z=' + x.zIndex);
      if (x.radius) bits.push('r=' + x.radius);
      if (x.boxShadow) bits.push('sh');
      if (x.text) bits.push('T="' + x.text + '" ' + x.fontSize + ' ' + x.font);
      console.log(`${pad}${x.order} ${x.tag}${x.id ? '#' + x.id : ''}.${x.cls.slice(0, 28)} [${x.x},${x.y} ${x.w}x${x.h}] ${bits.join(' ')}`);
    });
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
