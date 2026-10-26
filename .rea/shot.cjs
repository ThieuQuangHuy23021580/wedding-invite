const fs = require('fs');
const WS = process.argv[2];
const URL = process.argv[3];
const OUT = process.argv[4];
const W = Number(process.argv[5] || 420);
const H = Number(process.argv[6] || 760);
const SEL = process.argv[7];

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
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
    await send('Page.navigate', { url: URL });
    await sleep(5000);
    let clip;
    if (SEL) {
      const r = await send('Runtime.evaluate', {
        expression: `(() => { const e=document.querySelector(${JSON.stringify(SEL)}); if(!e) return null; const b=e.getBoundingClientRect(); return {x:b.left+scrollX,y:b.top+scrollY,width:b.width,height:b.height}; })()`,
        returnByValue: true,
      });
      clip = r.result.value;
    }
    if (!clip) clip = { x: 0, y: 0, width: W, height: H };
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...clip, scale: 1 } });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('saved', OUT, JSON.stringify(clip));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
