const fs = require('fs');
const path = require('path');

const PORT = process.argv[2];
const TARGET = process.argv[3];
const JOBS = JSON.parse(fs.readFileSync(process.argv[4], 'utf8'));
const OUTDIR = process.argv[5];

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

// Resize + re-encode via canvas inside the browser, return as base64
const EXPRESS = (jobs) => `(async () => {
  const jobs = ${JSON.stringify(jobs)};
  const out = [];
  for (const j of jobs) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('load fail')); img.src = j.url; });
      let w = j.w, h = j.h;
      const maxW = j.maxW, maxH = j.maxH;
      const scale = Math.min(1, maxW / w, maxH / h);
      w = Math.round(w * scale); h = Math.round(h * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = c.toDataURL('image/webp', j.quality || 0.86);
      out.push({ src: j.src, data: dataUrl.split(',')[1], w, h });
    } catch (e) {
      out.push({ src: j.src, error: String(e.message || e) });
    }
  }
  return out;
})()`;

ws.addEventListener('open', async () => {
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:5174/sheet.html' });
    await sleep(2500);

    const res = await evaluate(EXPRESS(JOBS));
    for (const r of res) {
      if (r.error) { console.log(`ERR ${r.src}: ${r.error}`); continue; }
      const out = path.join(OUTDIR, path.basename(r.src));
      fs.writeFileSync(out, Buffer.from(r.data, 'base64'));
      const sz = fs.statSync(out).size;
      console.log(`ok ${path.basename(r.src)} ${r.w}x${r.h} ${(sz / 1024).toFixed(0)}KB`);
    }
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
