const fs = require('fs');
const WS = process.argv[2];
const URL = process.argv[3];
const OUT = process.argv[4];
const W = Number(process.argv[5] || 420);

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
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: 900, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: URL });
    await sleep(6000);
    // force lazy reveal
    await send('Runtime.evaluate', {
      expression: `(async () => {
        const H = document.body.scrollHeight;
        for (let y = 0; y < H; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
      })()`, awaitPromise: true, returnByValue: true,
    });
    await sleep(1500);
    const m = await send('Page.getLayoutMetrics');
    const h = Math.ceil(m.cssContentSize.height);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: h, scale: 1 } });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('saved', OUT, 'h=' + h);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
