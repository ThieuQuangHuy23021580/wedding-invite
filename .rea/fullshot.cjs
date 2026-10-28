const fs = require('fs');
const WS = process.argv[2];
const URL = process.argv[3];
const OUT = process.argv[4];
const W = Number(process.argv[5] || 420);
const H = Number(process.argv[6] || 900);
const FULL = process.argv[7] === 'full';

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SCROLL = `(async () => {
  const total = document.body.scrollHeight;
  for (let y = 0; y <= total; y += 300) {
    window.scrollTo(0, y);
    await new Promise(function (r) { setTimeout(r, 120); });
  }
  window.scrollTo(0, 0);
  await new Promise(function (r) { setTimeout(r, 1500); });
  return 1;
})()`;

ws.addEventListener('open', async () => {
  try {
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: W,
      height: H,
      deviceScaleFactor: 1,
      mobile: true,
    });
    await send('Page.navigate', { url: URL });
    await sleep(4500);

    await send('Runtime.evaluate', { expression: SCROLL, awaitPromise: true });
    await sleep(2500);

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: FULL,
    });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('saved', OUT, Buffer.from(shot.data, 'base64').length);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
