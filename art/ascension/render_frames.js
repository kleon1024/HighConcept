// Deterministic frame capture: node render_frames.js --out frames --fps 30 --dur 30 --workers 4 [--from 0 --to 900] [--times 0.5,1.2] [--jpg]
const { chromium } = require('/home/user/HighConcept/film2/node_modules/playwright');
const fs = require('fs'), path = require('path');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const out = arg('out', path.join(__dirname, 'frames')), fps = +arg('fps', 30), dur = +arg('dur', 30), W = +arg('workers', 4);
const jpg = process.argv.includes('--jpg');
let jobs = [];
if (arg('times')) jobs = arg('times').split(',').map((t, i) => ({ t: +t, name: `t_${(+t).toFixed(2)}` }));
else { const f0 = +arg('from', 0), f1 = +arg('to', Math.round(fps * dur)); for (let f = f0; f < f1; f++) jobs.push({ t: f / fps, name: String(f).padStart(4, '0') }); }
fs.mkdirSync(out, { recursive: true });
jobs = jobs.filter(j => !fs.existsSync(path.join(out, j.name + (jpg ? '.jpg' : '.png'))) || process.argv.includes('--force'));
(async () => {
  const exe = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
  const t0 = Date.now(); let done = 0;
  const worker = async (wi) => {
    const b = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => console.log('pageerror', e.message));
    await p.goto('file://' + __dirname + '/index.html'); await p.evaluate(() => window.fontsReady);
    for (let j = wi; j < jobs.length; j += W) {
      const job = jobs[j];
      const data = await p.evaluate(([t, jpg]) => { window.renderAt(t); return document.getElementById('c').toDataURL(jpg ? 'image/jpeg' : 'image/png', 0.92); }, [job.t, jpg]);
      fs.writeFileSync(path.join(out, job.name + (jpg ? '.jpg' : '.png')), Buffer.from(data.split(',')[1], 'base64'));
      done++; if (done % 30 === 0) console.log(`${done}/${jobs.length} ${((Date.now() - t0) / done).toFixed(0)} ms/frame`);
    }
    await b.close();
  };
  await Promise.all([...Array(Math.min(W, jobs.length)).keys()].map(worker));
  console.log('done', jobs.length, 'frames in', ((Date.now() - t0) / 1000).toFixed(1), 's');
})();
