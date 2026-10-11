// node render.js → frame.png (1080×1920)
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('pageerror', e.message));
  await p.goto('file://' + __dirname + '/frame.html');
  await p.waitForFunction(() => window.frameDone === true, null, { timeout: 60000 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: __dirname + '/frame.png' }); await b.close();
})();
