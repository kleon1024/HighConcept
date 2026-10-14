"""Make the 道 film's paper: warm raw-silk/xuan paper with soft fibre texture and a little foxing.
Usage: python3 src/dao/make_paper.py → public/media/dao_paper.jpg (2400×1350)"""
import os, subprocess
import numpy as np
from scipy import ndimage
W, H = 2400, 1350
r = np.random.default_rng(7)
base = np.array([238, 231, 214], np.float32)
n1 = ndimage.gaussian_filter(r.standard_normal((H, W)), 40) * 120          # broad cloudiness
n2 = ndimage.gaussian_filter(r.standard_normal((H, W)), 2.2) * 9            # paper tooth
fib = np.zeros((H, W), np.float32)                                          # fibres: short soft strokes
for _ in range(2600):
    x, y, a, L = r.uniform(0, W), r.uniform(0, H), r.uniform(0, np.pi), r.uniform(20, 90)
    t = np.linspace(0, 1, int(L)); xs = (x + np.cos(a) * L * t).astype(int) % W; ys = (y + np.sin(a) * L * t + 6 * np.sin(t * 6)).astype(int) % H
    fib[ys, xs] += r.uniform(0.4, 1.0)
fib = ndimage.gaussian_filter(fib, 0.8) * 10
yy, xx = np.mgrid[0:H, 0:W]; vig = ((xx / W - 0.5) ** 2 + (yy / H - 0.5) ** 2) * 38            # darker towards the edges
tone = n1 + n2 - fib * 0.6 - vig
img = np.clip(base[None, None, :] + tone[..., None] * np.array([1.0, 1.0, 1.15]), 0, 255).astype(np.uint8)
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'media', 'dao_paper.jpg')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-i', '-', '-q:v', '3', out], input=img.tobytes(), check=True)
print(out)
