// node still.js out.png t [poster]
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
(async () => {
  const [out, t, mode] = [process.argv[2], parseFloat(process.argv[3] || '5'), process.argv[4]];
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('console:', m.text())); p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file://' + __dirname + '/index.html'); await p.evaluate(() => window.fontsReady);
  const t0 = Date.now(); await p.evaluate(([t, poster]) => window.renderAt(t, { poster }), [t, mode === 'poster']); console.log('render ms', Date.now() - t0);
  await p.screenshot({ path: out }); await b.close();
})();
