const fs = require('fs');
const WS = process.argv[2];
const OUT = process.argv[3];
const Y = Number(process.argv[4] || 0);
const H = Number(process.argv[5] || 713);
const W = Number(process.argv[6] || 420);

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
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: W, height: H, deviceScaleFactor: 1, mobile: true,
    });
    await sleep(1200);
    const r = await send('Runtime.evaluate', {
      expression: `document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0,${Y}); 1`,
      returnByValue: true,
    });
    await sleep(2200);
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('saved', OUT, 'bytes', Buffer.from(shot.data, 'base64').length);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
