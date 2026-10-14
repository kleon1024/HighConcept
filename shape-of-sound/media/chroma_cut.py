"""Cut a coloured object (e.g. a bronze) out of a neutral grey studio ground by chroma: keep saturated pixels, fill holes,
plus dark patina inside the convex hull; keep the largest blob; feather. Writes a PNG with alpha.
Usage: python3 media/chroma_cut.py in.jpg out.png width [chroma_threshold=18] [dark_below=0]"""
import subprocess, sys, numpy as np
from scipy import ndimage
src, dst, W = sys.argv[1], sys.argv[2], int(sys.argv[3]); thr = float(sys.argv[4]) if len(sys.argv) > 4 else 18
w, h = map(int, subprocess.run(['ffprobe','-v','error','-show_entries','stream=width,height','-of','csv=p=0',src],capture_output=True,text=True).stdout.split(','))
H = round(h * W / w / 2) * 2
img = np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',src,'-vf',f'scale={W}:{H}','-f','rawvideo','-pix_fmt','rgb24','-'],capture_output=True).stdout,np.uint8).reshape(H,W,3).astype(np.float32)
ch = img.max(2) - img.min(2)
m = ndimage.gaussian_filter(ch, 2) > thr
m = ndimage.binary_closing(m, iterations=6); m = ndimage.binary_fill_holes(m)
lab, n = ndimage.label(m); sizes = ndimage.sum(m, lab, range(1, n + 1)); m = lab == (np.argmax(sizes) + 1)
m = ndimage.binary_opening(m, iterations=2)
from scipy.spatial import ConvexHull, Delaunay
ys, xs = np.nonzero(m); P = np.c_[xs, ys]; hull = P[ConvexHull(P).vertices]
yy, xx = np.mgrid[0:H, 0:W]; inside = (Delaunay(hull).find_simplex(np.c_[xx.ravel(), yy.ravel()]) >= 0).reshape(H, W)
dark = img.mean(2) < float(sys.argv[5]) if len(sys.argv) > 5 else np.zeros_like(m)
m = ndimage.binary_fill_holes(m | (inside & dark)); m = ndimage.binary_opening(m, iterations=2)
a = np.clip(ndimage.gaussian_filter(m.astype(np.float32), 1.2) * 1.15, 0, 1)
out = np.dstack([img, a * 255]).astype(np.uint8)
subprocess.run(['ffmpeg','-y','-v','error','-f','rawvideo','-pix_fmt','rgba','-s',f'{W}x{H}','-i','-',dst],input=out.tobytes())
print(dst, W, H, f'{m.mean()*100:.0f}% kept')
