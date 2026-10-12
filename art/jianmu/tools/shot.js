// Screenshot a page (relative to art/jianmu): node tools/shot.js tools/figure_test.html out.png [w h]
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const path = require('path');
(async () => {
  const [page, out, w = 2048, h = 1024] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  p.on('pageerror', e => console.log('pageerror', e.message)); p.on('console', m => console.log('console', m.text()));
  await p.goto('file://' + path.resolve(__dirname, '..', page));
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  await p.screenshot({ path: out });
  await b.close();
})();
