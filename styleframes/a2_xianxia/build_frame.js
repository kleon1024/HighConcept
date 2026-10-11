// Builds frame.html: inlines the shared ASCENSION engine (gl.js, draw.js, shots.js) so the page is self-contained.
const fs = require('fs'), path = require('path');
const E = '/home/user/HighConcept/art/ascension/engine';
const js = ['gl.js', 'draw.js', 'shots.js'].map(f => `<script>/* ${f} */\n${fs.readFileSync(path.join(E, f), 'utf8')}\n</script>`).join('\n');
const html = `<!doctype html><html><head><meta charset="utf-8"><title>飞升 · Style A2 frame</title>
<link rel="stylesheet" href="node_modules/@fontsource/zhi-mang-xing/index.css">
<link rel="stylesheet" href="node_modules/@fontsource/noto-serif-sc/500.css">
<link rel="stylesheet" href="node_modules/@fontsource/ma-shan-zheng/index.css">
<style>html,body{margin:0;background:#000}canvas{display:block}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
${js}
<script>
window.fontsReady = Promise.all([
  document.fonts.load('200px "Zhi Mang Xing"', '飞升'),
  document.fonts.load('500 30px "Noto Serif SC"', '九重天上ASCENSION'),
  document.fonts.load('40px "Ma Shan Zheng"', '九重')]).then(() => { window.renderAt(5.0, { poster: true }); window.frameDone = true; });
</script></body></html>`;
fs.writeFileSync(path.join(__dirname, 'frame.html'), html);
console.log('frame.html', html.length, 'bytes');
