"""Make the 儒 film's stele-rubbing ground (碑拓): black ink pounded over paper on stone — mottled, with the paper's
grain showing through, a few cracks in the stone and soft wear at the edges.
Usage: python3 src/ru/make_rubbing.py → public/media/ru_rubbing.jpg (2400×1350)"""
import os, subprocess
import numpy as np
from scipy import ndimage
W, H = 2400, 1350
r = np.random.default_rng(1978)
mott = ndimage.gaussian_filter(r.standard_normal((H, W)), 24) * 60 + ndimage.gaussian_filter(r.standard_normal((H, W)), 6) * 22
tooth = ndimage.gaussian_filter(r.standard_normal((H, W)), 1.1) * 10
pores = (ndimage.gaussian_filter(r.standard_normal((H, W)), 1.6) > 0.55) * 26.0          # paper showing through the ink
crack = np.zeros((H, W), np.float32)
for _ in range(7):                                                                          # cracks in the stone: light wandering lines
    x, y, a = r.uniform(0, W), r.uniform(0, H), r.uniform(0, np.pi)
    for _ in range(int(r.uniform(300, 900))):
        a += r.normal(0, 0.12); x += np.cos(a) * 2; y += np.sin(a) * 2
        if 0 <= x < W and 0 <= y < H: crack[int(y), int(x)] = 1
crack = ndimage.gaussian_filter(crack, 1.2) * 70
yy, xx = np.mgrid[0:H, 0:W]; edge = np.clip(1 - np.minimum.reduce([xx, yy, W - 1 - xx, H - 1 - yy]) / 140, 0, 1) ** 2 * 40
dab = np.zeros((H, W), np.float32)                                                        # the ink pad's dabs (扑子): soft round blotches
for _ in range(900):
    x, y, rr, a = int(r.uniform(0, W)), int(r.uniform(0, H)), int(r.uniform(10, 70)), r.uniform(-1, 1)
    x0, x1, y0, y1 = max(0, x - rr), min(W, x + rr), max(0, y - rr), min(H, y + rr)
    gy, gx = np.mgrid[y0:y1, x0:x1]; dab[y0:y1, x0:x1] += a * np.exp(-((gx - x) ** 2 + (gy - y) ** 2) / (2 * (rr / 2.2) ** 2))
dab = ndimage.gaussian_filter(dab, 3) * 11
v = np.clip(30 + mott * 1.5 + tooth + pores * 1.5 + dab + crack + edge, 8, 140)
img = np.stack([v, v * 0.98, v * 0.95], axis=-1).clip(0, 255).astype(np.uint8)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'media', 'ru_rubbing.jpg')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-i', '-', '-q:v', '3', out], input=img.tobytes(), check=True)
print(out)
