// Frame-cost profiler: node tools/prof.js <t> — renders a frame with parts toggled off and prints ms per variant.
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const T = process.argv[2] ? +process.argv[2] : 0.5;
  const run = async (label, pre) => {
    const ms = await p.evaluate(([t, pre]) => {
      const gl = document.getElementById('c').getContext('webgl2'); const px = new Uint8Array(4);
      window.DBG = {}; eval(pre); window.renderAt(t); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const t0 = performance.now(); window.renderAt(t + 0.01); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - t0;
    }, [T, pre]);
    console.log(label.padEnd(24), ms.toFixed(0), 'ms');
  };
  await run('full', '');
  await run('no clouds', 'DBG.noClouds=1');
  await run('no sea', "DBG.hide=['sea']");
  await run('no clouds/sea', "DBG.noClouds=1; DBG.hide=['sea']");
  await run('no trunk', "DBG.hide=['jm_lower','jm_upper']");
  await run('only sky', 'DBG.onlySky=1');
  await b.close(); process.exit(0);
})();
