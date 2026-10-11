// Render frame.html -> frame.png (1080x1920) with headless Chromium.
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');

(async () => {
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
  });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', (m) => console.log('[page]', m.text()));
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto('file://' + __dirname + '/frame.html');
  // make sure every webfont subset actually used is in before shooting
  await p.evaluate(async () => {
    await Promise.all([
      document.fonts.load('900 200px "Noto Sans SC"', '百鬼夜行祭鬼狐面※'),
      document.fonts.load('900 60px "Unbounded"', 'NIGHT PARADE 2026'),
      document.fonts.load('400 12px "JetBrains Mono"', 'ABC 0123'),
      document.fonts.load('400 20px "Major Mono Display"', 'abc'),
    ]);
    await document.fonts.ready;
  });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: __dirname + '/frame.png' });
  await b.close();
})();
