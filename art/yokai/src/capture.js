// Capture frames with N parallel Playwright pages.  node capture.js [start end step] [--out dir] [--pages N]
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const path = require('path'), fs = require('fs');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const nums = args.filter((a, i) => /^\d+$/.test(a) && !['--pages'].includes(args[i - 1]));
const start = +(nums[0] ?? 0), end = +(nums[1] ?? 899), step = +(nums[2] ?? 1);
const out = path.resolve(opt('--out', path.join(__dirname, '..', 'frames')));
const N = +opt('--pages', 4);
fs.mkdirSync(out, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--allow-file-access-from-files'] });
  let frames = []; for (let f = start; f <= end; f += step) frames.push(f);
  if (opt('--list')) frames = fs.readFileSync(opt('--list'), 'utf8').trim().split(/\s+/).map(Number);
  let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: N }, async () => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await p.goto('file://' + path.join(__dirname, 'yokai.html'));
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    while (next < frames.length) {
      const f = frames[next++];
      await p.evaluate((t) => window.renderAt(t), f / 30);
      await p.screenshot({ path: path.join(out, String(f).padStart(4, '0') + '.png') });
      if (++done % 50 === 0) console.log(done, '/', frames.length, ((Date.now() - t0) / 1000).toFixed(0) + 's');
    }
    await p.close();
  }));
  await b.close();
  console.log('captured', frames.length, 'frames ->', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
})();
