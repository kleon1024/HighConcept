"""Cut a plate's subjects out of its plain background: flood-fill the background from the border (pixels close to the
background colour), drop small specks, feather the edge, write a PNG with alpha.
Usage: python3 media/cutout.py in.jpg out.png white|black [tolerance] [max_width] [hole_px]
(hole_px: enclosed background pockets larger than this, e.g. between tentacles, are cut out too)"""
import subprocess, sys
import numpy as np
from scipy import ndimage

src, dst, bg = sys.argv[1], sys.argv[2], sys.argv[3]
tol = float(sys.argv[4]) if len(sys.argv) > 4 else 40
maxw = int(sys.argv[5]) if len(sys.argv) > 5 else 1400
hole = int(sys.argv[6]) if len(sys.argv) > 6 else 0
w, h = map(int, subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', src], capture_output=True, text=True).stdout.split(','))
if w > maxw: w, h = maxw, round(h * maxw / w / 2) * 2
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
img = np.frombuffer(raw, np.uint8).reshape(h, w, 3).astype(np.float32)
ref = np.median(np.concatenate([img[:8].reshape(-1, 3), img[-8:].reshape(-1, 3), img[:, :8].reshape(-1, 3), img[:, -8:].reshape(-1, 3)]), axis=0)
near = np.linalg.norm(img - ref, axis=2) < tol
lab, n = ndimage.label(near)
border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
back = np.isin(lab, border[border > 0])
if hole:
    sz = ndimage.sum(near, lab, range(1, n + 1))
    back |= np.isin(lab, 1 + np.flatnonzero(sz >= hole))
fore = ~back
lab2, n2 = ndimage.label(fore)                                  # drop specks of dust and stray marks
sizes = ndimage.sum(fore, lab2, range(1, n2 + 1))
fore = np.isin(lab2, 1 + np.flatnonzero(sizes >= 400))
fore = ndimage.binary_closing(fore, iterations=2)
alpha = ndimage.gaussian_filter(fore.astype(np.float32), 1.2)
rgba = np.dstack([img, alpha[..., None] * 255]).clip(0, 255).astype(np.uint8)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{w}x{h}', '-i', '-', dst], input=rgba.tobytes(), check=True)
print(dst, w, h, f'{fore.mean():.0%} kept, background {ref.round()}')
