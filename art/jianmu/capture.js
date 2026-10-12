// Deterministic frame capture of index.html → frames/NNNN.jpg
//   node capture.js --out frames --workers 3 [--from 0 --to 900] [--step 1] [--times 0.5,1.2] [--scale 0.5] [--force]
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const out = path.resolve(__dirname, arg('out', 'frames')), W = +arg('workers', 3), fps = 30, q = +arg('q', 0.94);
let jobs = [];
if (arg('times')) jobs = arg('times').split(',').map(t => ({ t: +t, name: 't' + (+t).toFixed(2) }));
else { const f0 = +arg('from', 0), f1 = +arg('to', 900), st = +arg('step', 1); for (let f = f0; f < f1; f += st) jobs.push({ t: f / fps, name: String(f).padStart(4, '0') }); }
fs.mkdirSync(out, { recursive: true });
if (!process.argv.includes('--force')) jobs = jobs.filter(j => !fs.existsSync(path.join(out, j.name + '.jpg')));
const exe = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
(async () => {
  const t0 = Date.now(); let done = 0;
  const launch = async () => {
    const b = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => console.log('pageerror', e.message));
    p.on('console', m => { if (/error/i.test(m.type())) console.log('console', m.text()); });
    await p.goto('file://' + path.join(__dirname, 'index.html'));
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 600000 });
    return { b, p };
  };
  const timeout = (pr, ms) => Promise.race([pr, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
  const worker = async (wi) => {
    let B = await launch();
    for (let j = wi; j < jobs.length; j += W) {
      const job = jobs[j];
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const data = await timeout(B.p.evaluate(([t, q]) => { window.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', q); }, [job.t, q]), 180000);
          fs.writeFileSync(path.join(out, job.name + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
          break;
        } catch (e) { console.log('retry', job.name, e.message); try { await B.b.close(); } catch (_) {} B = await launch(); }
      }
      done++; if (done % 20 === 0 || done === jobs.length) console.log(`${done}/${jobs.length}  ${((Date.now() - t0) / done / 1000 * W).toFixed(2)} s/frame/worker`);
    }
    await B.b.close();
  };
  await Promise.all([...Array(Math.min(W, jobs.length)).keys()].map(worker));
  console.log('done', jobs.length, 'in', ((Date.now() - t0) / 1000).toFixed(1), 's');
  process.exit(0);
})();
