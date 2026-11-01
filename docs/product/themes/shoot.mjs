// Screenshot every .phone in the mockup board: node shoot.mjs <html> <outDir>
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const [, , html, out] = process.argv;
const PORT = 9361;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', `--remote-debugging-port=${PORT}`, `--user-data-dir=${out}/profile-${Date.now()}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let v; for (let i = 0; i < 50 && !v; i++) { try { v = await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json(); } catch { await sleep(200); } }
const ws = new WebSocket(v.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const send = (method, params = {}, sessionId) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) })); });
const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
const { result: { sessionId: s } } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1320, height: 1000, deviceScaleFactor: 2, mobile: false }, s);
await send('Page.enable', {}, s);
await send('Page.navigate', { url: pathToFileURL(html).href }, s);
await sleep(3000);
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }, s)).result?.result?.value;
await ev('document.fonts.ready.then(() => true)');
const rects = await ev(`[...document.querySelectorAll('.direction')].flatMap((d) => [...d.querySelectorAll('.phone')].map((p, i) => { const r = p.getBoundingClientRect(); return { name: d.id + '-' + ['welcome','menu','uploads'][i], x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }; }))`);
for (const r of rects) {
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } }, s);
  writeFileSync(`${out}/${r.name}.png`, Buffer.from(shot.result.data, 'base64'));
}
console.log(rects.map((r) => `${r.name} ${Math.round(r.w)}x${Math.round(r.h)}`).join('\n'));
await send('Browser.close').catch(() => {}); ws.close(); chrome.kill(); process.exit(0);
