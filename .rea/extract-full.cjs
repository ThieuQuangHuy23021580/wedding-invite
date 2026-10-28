const WS_BASE = process.argv[2]; // e.g. http://127.0.0.1:9334
const TARGET = process.argv[3];
const OUTDIR = process.argv[4];

const fs = require('fs');
const path = require('path');

fs.mkdirSync(OUTDIR, { recursive: true });

const ws = new WebSocket(`ws://127.0.0.1:${new URL(WS_BASE).port}/devtools/page/${TARGET}`);
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

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails, null, 2));
  return r.result.value;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXTRACT = String.raw`
(async () => {
  // Full scroll pass to trigger every lazy loader / IntersectionObserver
  const total = document.body.scrollHeight;
  for (let y = 0; y <= total; y += 400) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 1200));

  function urlOf(bg) {
    const m = String(bg || '').match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : null;
  }

  function describe(el, secRect, order, depth, pathStr) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) return null;
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    if (parseFloat(cs.opacity) === 0) return null;

    const bgUrl = urlOf(cs.backgroundImage);
    const maskUrl = urlOf(cs.maskImage) || urlOf(cs.webkitMaskImage);
    const borderImg = cs.borderImageSource || '';
    const borderUrl = urlOf(borderImg);

    const own = [...el.childNodes]
      .filter(n => n.nodeType === 3 && n.textContent.trim())
      .map(n => n.textContent.trim())
      .join(' ')
      .slice(0, 140);

    const rec = {
      order, depth, path: pathStr,
      tag: el.tagName.toLowerCase(),
      id: el.id || '',
      cls: (el.className || '').toString().slice(0, 70),
      x: +r.left.toFixed(1),
      y: +(r.top - secRect.top).toFixed(1),
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      relX: +(r.left - secRect.left).toFixed(1),
      z: cs.zIndex,
      op: cs.opacity,
      transform: cs.transform === 'none' ? '' : cs.transform,
      bgUrl: bgUrl || '',
      bgSize: cs.backgroundSize,
      bgPos: cs.backgroundPosition,
      bgRepeat: cs.backgroundRepeat,
      maskUrl: maskUrl || '',
      maskSize: cs.maskSize || '',
      maskPos: cs.maskPosition || '',
      borderUrl: borderUrl || '',
      radius: cs.borderRadius,
      border: cs.borderWidth !== '0px' ? cs.border : '',
      filter: cs.filter === 'none' ? '' : cs.filter,
      overflow: cs.overflow,
    };

    if (own) {
      rec.text = own;
      rec.font = cs.fontFamily.split(',')[0].replace(/["']/g, '');
      rec.size = parseFloat(cs.fontSize);
      rec.weight = cs.fontWeight;
      rec.color = cs.color;
      rec.italic = cs.fontStyle === 'italic' ? 'italic' : '';
      rec.ls = cs.letterSpacing;
      rec.lh = cs.lineHeight;
      rec.align = cs.textAlign;
      rec.lhNum = cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight);
    }

    return rec;
  }

  const sections = [];
  const secs = [...document.querySelectorAll('.com-section')];

  secs.forEach((sec, si) => {
    const secRect = sec.getBoundingClientRect();
    const rows = [];
    let order = 0;

    function walk(el, depth, pathStr) {
      const rec = describe(el, secRect, order, depth, pathStr);
      if (rec) { rows.push(rec); order++; }
      if (depth > 14) return;
      [...el.children].forEach((child, ci) => walk(child, depth + 1, pathStr + '/' + ci));
    }

    walk(sec, 0, '');

    sections.push({
      i: si,
      id: sec.id,
      top: Math.round(secRect.top + window.scrollY),
      h: Math.round(secRect.height),
      w: Math.round(secRect.width),
      rows,
    });
  });

  return {
    docH: document.body.scrollHeight,
    canvasW: document.querySelector('.com-section')?.getBoundingClientRect().width,
    canvasLeft: document.querySelector('.com-section')?.getBoundingClientRect().left,
    sections,
  };
})()
`;

ws.addEventListener('open', async () => {
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 420, height: 900, deviceScaleFactor: 1, mobile: true,
    });
    await sleep(2500);
    await send('Page.reload', { ignoreCache: true });
    await sleep(4000);

    const data = await evaluate(EXTRACT);
    fs.writeFileSync(path.join(OUTDIR, 'full-tree.json'), JSON.stringify(data, null, 2), 'utf8');
    console.log(`docH=${data.docH} canvasW=${data.canvasW} sections=${data.sections.length}`);
    data.sections.forEach((s) => console.log(`  [${s.i}] ${s.id} h=${s.h} rows=${s.rows.length}`));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
