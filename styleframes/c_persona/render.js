// Render frame.html -> frame.png (1080x1920) with headless Chromium.
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');

(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--allow-file-access-from-files'],
  });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', (m) => console.log('[page]', m.text()));
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + __dirname + '/frame.html');
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: __dirname + '/frame.png' });
  await b.close();
  console.log('wrote', __dirname + '/frame.png');
})();
