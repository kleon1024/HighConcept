// node tools/debug.js <t> <out.jpg> '<js to run before render>'
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const [t, out, pre = ''] = process.argv.slice(2);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('pageerror', e.message)); p.on('console', m => console.log('console', m.text()));
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 120000 });
  const data = await p.evaluate(([t, pre]) => { window.DBG = {}; eval(pre); window.renderAt(+t); return document.getElementById('c').toDataURL('image/jpeg', 0.9); }, [t, pre]);
  fs.writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
  await b.close(); process.exit(0);
})();
