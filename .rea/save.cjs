const fs = require('fs');
const WS = process.argv[2];
const EXPR = process.argv[3];
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
    const r = await send('Runtime.evaluate', {
      expression: EXPR,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) {
      console.error('EXCEPTION', JSON.stringify(r.exceptionDetails, null, 2));
    } else {
      const v = r.result.value;
      if (typeof v === 'string') {
        fs.writeFileSync(OUT, v, 'utf8');
        console.log('wrote', OUT, v.length, 'chars');
      } else {
        fs.writeFileSync(OUT, JSON.stringify(v, null, 2), 'utf8');
        console.log('wrote', OUT, 'json');
      }
    }
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
