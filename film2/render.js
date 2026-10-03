// Headless frame-exact renderer: node render.js [--from N] [--to N] [--only 1,2,3] [--scale 0.5] [--workers 2] [--no-encode]
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';
import { FPS, DURATION } from './src/plan.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const total = Math.round(DURATION * FPS);
const from = Number(arg('from', 0)), to = Number(arg('to', total));
const only = arg('only', null);
const scale = arg('scale', '1'), workers = Number(arg('workers', 2)), blur = Number(arg('blur', 1));
const outDir = path.join(root, 'out', arg('dir', 'frames'));
fs.mkdirSync(outDir, { recursive: true });

const types = { '.js': 'text/javascript', '.html': 'text/html' };
const server = http.createServer((q, s) => {
  const f = path.join(root, decodeURIComponent(q.url.split('?')[0]));
  fs.readFile(f, (e, d) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); s.end(d); });
}).listen(0);
const port = server.address().port;

const frames = only ? only.split(',').map(Number) : Array.from({ length: to - from }, (_, i) => from + i);
const browser = await chromium.launch({
  executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const t0 = Date.now(); let done = 0;
async function work(w) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('PAGE', m.text()); });
  await page.goto(`http://localhost:${port}/index.html?scale=${scale}`);
  await page.waitForFunction('window.ready === true', null, { timeout: 60000 });
  // each worker takes a contiguous chunk so scenes are built once per shot
  const n = Math.ceil(frames.length / workers), mine = frames.slice(w * n, (w + 1) * n);
  for (const f of mine) {
    const data = await page.evaluate(([fr, n]) => window.renderOut(fr, n), [f, blur]);
    fs.writeFileSync(path.join(outDir, `${String(f).padStart(5, '0')}.png`), Buffer.from(data.split(',')[1], 'base64'));
    if (++done % 30 === 0) console.log(`${done}/${frames.length}  ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
  }
  await page.close();
}
await Promise.all(Array.from({ length: workers }, (_, w) => work(w)));
await browser.close(); server.close();
console.log(`rendered ${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);

if (!only && !process.argv.includes('--no-encode')) {
  const wav = path.join(root, 'out', 'score.wav'), mp4 = path.join(root, 'out', 'FIRST_LIGHT_30s.mp4');
  execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-framerate', String(FPS), '-start_number', String(from), '-i', path.join(outDir, '%05d.png'), '-i', wav,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-tune', 'film', '-c:a', 'aac', '-b:a', '320k', '-af', 'aresample=48000', '-shortest', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  console.log('wrote', mp4);
}
