// 御剑 YUJIAN — captions on a 2D canvas composited in the final pass. Characters stagger in (60 ms), drift up and sharpen;
// whole lines fade out. Ink on light frames, white on dark ones.
import { W, H, clamp, easeOut, smooth } from './util.js';

export class Captions {
  constructor() { this.c = document.createElement('canvas'); this.c.width = W; this.c.height = H; this.ctx = this.c.getContext('2d'); }
  // items: [{text, t0, t1, x, y, size, font, color, glow, sub, align, vertical, stagger, spacing, weight}]
  draw(t, items) {
    const ctx = this.ctx; ctx.clearRect(0, 0, W, H);
    let any = false;
    for (const it of items) {
      if (t < it.t0 - 0.01 || t > it.t1 + 0.6) continue;
      any = true;
      const st = it.stagger ?? 0.06, fin = 0.4;
      const out = clamp((t - it.t1) / 0.45);
      const chars = [...it.text];
      const size = it.size || 64; const font = it.font || `${it.weight || 500} ${size}px "Noto Serif SC"`;
      ctx.font = font; ctx.textBaseline = 'middle';
      const sp = (it.spacing ?? 0.12) * size;
      const widths = chars.map(ch => ctx.measureText(ch).width);
      const total = it.vertical ? chars.length * (size + sp) - sp : widths.reduce((a, b) => a + b, 0) + sp * (chars.length - 1);
      let x0 = it.align === 'left' ? it.x : it.x - total / 2;
      let y0 = it.vertical ? it.y - total / 2 + size / 2 : it.y;
      chars.forEach((ch, i) => {
        const a0 = it.t0 + i * st; const k = clamp((t - a0) / fin);
        const al = easeOut(k) * (1 - smooth(out));
        if (al <= 0.001) { if (it.vertical) y0 += size + sp; else x0 += widths[i] + sp; return; }
        const dy = (1 - easeOut(k)) * 10;
        ctx.save(); ctx.globalAlpha = al;
        ctx.shadowColor = it.glow || 'rgba(250,252,248,0.55)'; ctx.shadowBlur = (it.glowBlur ?? 10) + (1 - k) * 12;
        ctx.fillStyle = it.color || '#1d3439';
        if (it.vertical) { ctx.textAlign = 'center'; ctx.fillText(ch, it.x, y0 + dy); y0 += size + sp; }
        else { ctx.textAlign = 'left'; ctx.fillText(ch, x0, y0 + dy); x0 += widths[i] + sp; }
        // second pass without glow for crisp edges
        ctx.shadowBlur = 0; ctx.globalAlpha = al * 0.9;
        if (it.vertical) ctx.fillText(ch, it.x, y0 - (size + sp) + dy); else ctx.fillText(ch, x0 - widths[i] - sp, y0 + dy);
        ctx.restore();
      });
      if (it.rule) { // a thin hairline (annotation pointer)
        const k = easeOut(clamp((t - it.t0) / 0.6)) * (1 - smooth(out));
        ctx.save(); ctx.globalAlpha = k * 0.7; ctx.strokeStyle = it.color || '#1d3439'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(it.rule[0], it.rule[1]); ctx.lineTo(it.rule[0] + (it.rule[2] - it.rule[0]) * k, it.rule[1] + (it.rule[3] - it.rule[1]) * k); ctx.stroke(); ctx.restore();
      }
    }
    return any ? this.c : null;
  }
  // title: two calligraphic characters written on (top-to-bottom wipe per character), a vermilion seal, a small romanisation
  title(t, o) {
    const ctx = this.ctx; const { t0, x, y, size } = o;
    if (t < t0) return;
    const chars = [...o.text];
    chars.forEach((ch, i) => {
      const a0 = t0 + i * 0.45, k = clamp((t - a0) / 0.75); if (k <= 0) return;
      const cx = x + (i - (chars.length - 1) / 2) * size * 0.92, cy = y;
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - size, cy - size * 0.7, size * 2, size * 1.4 * easeOut(k) + 2); ctx.clip();
      ctx.font = `${size}px "Zhi Mang Xing"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.shadowColor = o.glow || 'rgba(255,240,200,0.9)'; ctx.shadowBlur = 30;
      ctx.fillStyle = o.color || '#1b2f33'; ctx.fillText(ch, cx, cy);
      ctx.shadowBlur = 0; ctx.fillText(ch, cx, cy);
      ctx.restore();
    });
    // seal
    const ks = clamp((t - t0 - 1.0) / 0.25);
    if (ks > 0) {
      const sx = x + size * 1.02, sy = y + size * 0.42, s = 64 * (1 + (1 - easeOut(ks)) * 0.4);
      ctx.save(); ctx.globalAlpha = easeOut(ks); ctx.translate(sx, sy);
      ctx.fillStyle = '#c23b26'; roundRect(ctx, -s / 2, -s / 2, s, s, 6); ctx.fill();
      ctx.fillStyle = '#fbeee0'; ctx.font = `${s * 0.42}px "Ma Shan Zheng"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('建', 0, -s * 0.2); ctx.fillText('木', 0, s * 0.24);
      ctx.restore();
    }
    const kr = clamp((t - t0 - 1.15) / 0.5);
    if (kr > 0) {
      ctx.save(); ctx.globalAlpha = easeOut(kr) * 0.85; ctx.font = '500 26px "Noto Serif SC"'; ctx.textAlign = 'center'; ctx.fillStyle = o.color || '#1b2f33';
      ctx.shadowColor = o.glow || 'rgba(255,240,200,0.9)'; ctx.shadowBlur = 12;
      ctx.fillText('Y  U  J  I  A  N', x, y + size * 0.78); ctx.restore();
    }
  }
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
