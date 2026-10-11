// Capture frames of index.html with Playwright: node capture.js [from] [to] [step] [workers] [outdir]
//   full run:  node capture.js 0 899 1 3 frames
//   stills:    node capture.js 0 899 30 1 build/stills
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const fs = require('fs'), path = require('path');
const [from = 0, to = 899, step = 1, workers = 3, outdir = 'frames'] = process.argv.slice(2).map((v, i) => i < 4 ? Number(v) : v);
const list = process.argv[7] ? process.argv[7].split(',').map(Number) : null;   // optional explicit frame list
const FPS = 30;
(async () => {
  const out = path.resolve(__dirname, outdir); fs.mkdirSync(out, { recursive: true });
  const frames = list || []; if (!list) for (let f = from; f <= to; f += step) frames.push(f);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const t0 = Date.now(); let done = 0;
  const chunks = Array.from({ length: workers }, (_, w) => frames.filter((_, i) => i % workers === w));
  await Promise.all(chunks.map(async (chunk, w) => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => console.log('[pageerror w' + w + ']', e.message));
    p.on('console', m => { if (/error|warn/i.test(m.type()) && !/GPU stall|swiftshader|GroupMarker/i.test(m.text())) console.log('[w' + w + ']', m.text()); });
    await p.goto('file://' + __dirname + '/index.html');
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 300000 });
    for (const f of chunk) {
      await p.evaluate(t => window.renderAt(t), f / FPS);
      await p.screenshot({ path: path.join(out, String(f).padStart(4, '0') + '.png') });
      if (++done % 25 === 0) console.log(`${done}/${frames.length}  ${((Date.now() - t0) / done / 1000 * workers).toFixed(2)} s/frame/worker`);
    }
    await p.close();
  }));
  console.log('done', frames.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(0), 's');
  await b.close();
})();
