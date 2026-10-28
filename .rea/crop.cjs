const fsx = require('fs');
const path = require('path');

const { execFileSync } = require('child_process');
const WS = process.argv[2];
const SRC = process.argv[3];
const OUTDIR = process.argv[4];
const CUTS = JSON.parse(fsx.readFileSync(process.argv[5], 'utf8').replace(/^\uFEFF/, ''));

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

async function evaluate(expression) {
  const r = await send('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails, null, 2));
  return r.result.value;
}

ws.addEventListener('open', async () => {
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:5174/sheet.html' });
    await new Promise((r) => setTimeout(r, 2000));

    for (const cut of CUTS) {
      const expr = `(async () => {
        const img = new Image();
        await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('load')); img.src = '${SRC}'; });
        const c = document.createElement('canvas');
        c.width = ${cut.w}; c.height = ${cut.h};
        const ctx = c.getContext('2d');
        ctx.drawImage(img, ${cut.x}, ${cut.y}, ${cut.w}, ${cut.h}, 0, 0, ${cut.w}, ${cut.h});
        return c.toDataURL('image/png').split(',')[1];
      })()`;
      const data = await evaluate(expr);
      const out = path.join(OUTDIR, cut.name);
      fsx.writeFileSync(out, Buffer.from(data, 'base64'));
      console.log('saved', cut.name);
    }
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
