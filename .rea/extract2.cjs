const fs = require('fs');
const path = require('path');

const PORT = process.argv[2];
const TARGET = process.argv[3];
const OUTDIR = process.argv[4];
fs.mkdirSync(OUTDIR, { recursive: true });

const ws = new WebSocket(`ws://127.0.0.1:${PORT}/devtools/page/${TARGET}`);
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
    expression, returnByValue: true, awaitPromise: true, userGesture: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails, null, 2));
  return r.result.value;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EXTRACT = String.raw`
(async () => {
  const total = document.body.scrollHeight;
  for (let y = 0; y <= total; y += 400) {
    window.scrollTo(0, y);
    await new Promise(r => setTimeout(r, 90));
  }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 1500));

  const urlOf = (s) => {
    const m = String(s || '').match(/url\(["']?([^"')]+)["']?\)/);
    return m ? m[1] : null;
  };

  const rotOf = (tf) => {
    if (!tf || tf === 'none') return 0;
    let m = tf.match(/^matrix\(([^)]+)\)$/);
    if (m) {
      const [a, b] = m[1].split(',').map(Number);
      return Math.round(Math.atan2(b, a) * 180 / Math.PI * 100) / 100;
    }
    m = tf.match(/^matrix3d\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(',').map(Number);
      // m11=p[0], m12=p[1]
      return Math.round(Math.atan2(p[1], p[0]) * 180 / Math.PI * 100) / 100;
    }
    return 0;
  };

  const scaleOf = (tf) => {
    if (!tf || tf === 'none') return 1;
    const m = tf.match(/^matrix\(([^)]+)\)$/);
    if (m) {
      const [a, b] = m[1].split(',').map(Number);
      return Math.round(Math.hypot(a, b) * 1000) / 1000;
    }
    return 1;
  };

  const sections = [];
  const secs = [...document.querySelectorAll('.com-section')];

  secs.forEach((sec, si) => {
    const secRect = sec.getBoundingClientRect();
    const nodes = [];

    // Map every descendant to an index for offsetParent linkage
    const all = [sec, ...sec.querySelectorAll('*')];
    const idx = new Map(all.map((el, i) => [el, i]));

    all.forEach((el, i) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (parseFloat(cs.opacity) === 0) return;

      const bgUrl = urlOf(cs.backgroundImage);
      const maskUrl = urlOf(cs.maskImage) || urlOf(cs.webkitMaskImage);
      const borderUrl = urlOf(cs.borderImageSource);
      const isGradient = /gradient/.test(cs.backgroundImage) && !bgUrl;

      const ownText = [...el.childNodes]
        .filter((n) => n.nodeType === 3 && n.textContent.trim())
        .map((n) => n.textContent.trim())
        .join(' ')
        .slice(0, 200);

      const ow = el.offsetWidth;
      const oh = el.offsetHeight;
      if (ow < 1 || oh < 1) return;

      const paints = !!(bgUrl || maskUrl || borderUrl || ownText);

      // offsetParent link (may be outside the section)
      let opIdx = -1;
      const op = el.offsetParent;
      if (op && idx.has(op)) opIdx = idx.get(op);

      const relRect = el.getBoundingClientRect();

      const rec = {
        i,
        parent: opIdx,
        paints,
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        cls: (el.className || '').toString().slice(0, 60),
        left: el.offsetLeft,
        top: el.offsetTop,
        w: ow,
        h: oh,
        cx: Math.round((relRect.left + relRect.width / 2 - secRect.left) * 10) / 10,
        cy: Math.round((relRect.top + relRect.height / 2 - secRect.top) * 10) / 10,
        rot: rotOf(cs.transform),
        scale: scaleOf(cs.transform),
        z: cs.zIndex === 'auto' ? null : parseInt(cs.zIndex, 10),
        op: cs.opacity,
        radius: cs.borderRadius,
        overflow: cs.overflow,
        bgUrl: bgUrl || '',
        bgSize: cs.backgroundSize,
        bgPos: cs.backgroundPosition,
        gradient: isGradient ? cs.backgroundImage : '',
        position: cs.position,
        display: cs.display,
        borderColor: cs.borderTopColor,
        borderStyle: cs.borderTopStyle,
        borderWidth: cs.borderTopWidth,
        radiusAll: cs.borderRadius,
        maskUrl: maskUrl || '',
        maskSize: cs.maskSize || '',
        maskPos: cs.maskPosition || '',
        borderUrl: borderUrl || '',
        border: cs.borderStyle !== 'none' ? cs.border : '',
        href: (el.closest('a') && el.closest('a').getAttribute('href')) || '',
        text: ownText,
      };

      if (ownText) {
        rec.font = cs.fontFamily;
        rec.size = parseFloat(cs.fontSize);
        rec.weight = cs.fontWeight;
        rec.color = cs.color;
        rec.italic = cs.fontStyle;
        rec.ls = cs.letterSpacing;
        rec.lh = cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight);
        rec.align = cs.textAlign;
        rec.textTransform = cs.textTransform;
        rec.whiteSpace = cs.whiteSpace;
      }

      nodes.push(rec);
    });

    sections.push({
      i: si,
      id: sec.id,
      h: Math.round(secRect.height),
      bgColor: getComputedStyle(sec).backgroundColor,
      nodes,
    });
  });

  return {
    docH: document.body.scrollHeight,
    canvasLeft: secs[0].getBoundingClientRect().left,
    canvasW: secs[0].getBoundingClientRect().width,
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
    await sleep(4500);

    const data = await evaluate(EXTRACT);
    fs.writeFileSync(path.join(OUTDIR, 'model.json'), JSON.stringify(data, null, 2), 'utf8');
    console.log(`docH=${data.docH} canvasLeft=${data.canvasLeft} canvasW=${data.canvasW}`);
    data.sections.forEach((s) => console.log(`  [${s.i}] ${s.id} h=${s.h} nodes=${s.nodes.length}`));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
