const fs = require('fs');
const WS = process.argv[2];
const FILE = process.argv[3];
const expr = fs.readFileSync(FILE, 'utf8');

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
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (r.exceptionDetails) console.error('EXCEPTION', JSON.stringify(r.exceptionDetails, null, 2));
    else console.log(JSON.stringify(r.result.value, null, 2));
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    ws.close();
  }
});
