// Render frame.html -> frame.png (1080x1920) with headless Chromium + SwiftShader WebGL.
// usage: node render.js [out.png]
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');

(async () => {
  const out = process.argv[2] || __dirname + '/frame.png';
  const b = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
    args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader',
      '--allow-file-access-from-files'],   // lets the page load its local ES modules, fonts and glyph files
  });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', (m) => { if (!/GroupMarkerNotSet|swiftshader/i.test(m.text())) console.log('[page]', m.text()); });
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const t0 = Date.now();
  await p.goto('file://' + __dirname + '/frame.html');
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: out });
  console.log('rendered', out, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  await b.close();
})();
