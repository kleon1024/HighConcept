const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell', args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.resolve(__dirname, '..', 'index.html'));
  await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
  const r = await p.evaluate((t) => {
    const R = window.__renderer; R.info.autoReset = false; R.info.reset(); window.renderAt(t);
    const out = { calls: R.info.render.calls, tris: R.info.render.triangles };
    // per top-level child of the scene: triangle estimate (index or position count / 3 × instances)
    const per = [];
    window.__world.scene.traverse(o => { if (!o.isMesh || !o.visible) return; let vis = true; let q = o; while (q) { if (!q.visible) { vis = false; break; } q = q.parent; } if (!vis) return; const g = o.geometry; const n = (g.index ? g.index.count : g.attributes.position.count) / 3; const inst = o.isInstancedMesh ? o.count : 1; per.push([o.name || o.material.type + ':' + (g.type || ''), Math.round(n * inst), inst]); });
    per.sort((a, b) => b[1] - a[1]); out.top = per.slice(0, 40).map(x => x[1] + 'x' + x[2]); out.sum = per.reduce((a, x) => a + x[1], 0); out.n = per.length; return out;
  }, +process.argv[2] || 0.5);
  console.log(JSON.stringify(r, null, 0)); await b.close(); process.exit(0);
})();
