const fs = require('fs');
const WS = process.argv[2];
const URL = process.argv[3];
const OUT = process.argv[4];
const W = Number(process.argv[5] || 1000);
const H = Number(process.argv[6] || 900);

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

ws.addEventListener('open', async () => {
  try {
    await send('Page.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: W, height: H, deviceScaleFactor: 1, mobile: false,
    });
    await send('Page.navigate', { url: URL });
    await sleep(2500);
    const metrics = await send('Page.getLayoutMetrics');
    const full = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: W, height: Math.min(metrics.cssContentSize.height, 3000), scale: 1 },
    });
    fs.writeFileSync(OUT, Buffer.from(full.data, 'base64'));
    console.log('saved', OUT, 'h=' + metrics.cssContentSize.height);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
