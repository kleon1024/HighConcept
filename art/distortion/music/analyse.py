"""Measure the score: momentary loudness curve, band balance per section, stem levels (we cannot listen)."""
import sys, json, numpy as np, soundfile as sf, pyloudnorm as pyln, glob, os
from scipy.signal import butter, sosfilt
p = sys.argv[1] if len(sys.argv) > 1 else 'build/music.wav'
x, sr = sf.read(p); meter = pyln.Meter(sr)
print('integrated LUFS', round(meter.integrated_loudness(x), 2), 'peak dBFS', round(20*np.log10(np.abs(x).max()), 2))
# momentary loudness (400 ms, hop 250 ms)
w, h = int(0.4*sr), int(0.25*sr); line = []
for i in range(0, len(x)-w, h):
    seg = x[i:i+w]
    try: l = pyln.Meter(sr, block_size=0.4).integrated_loudness(seg)
    except Exception: l = -70
    line.append((round(i/sr, 2), round(l, 1)))
print('momentary (t, LUFS):', ' '.join(f'{t}:{l}' for t, l in line[::2]))
def bands(seg):
    sp = np.abs(np.fft.rfft(seg.mean(1) * np.hanning(len(seg))))**2; f = np.fft.rfftfreq(len(seg), 1/sr); tot = sp.sum()+1e-12
    r = lambda a, b: 10*np.log10(sp[(f>=a)&(f<b)].sum()/tot+1e-12)
    return f'sub<60 {r(20,60):6.1f} | low 60-250 {r(60,250):6.1f} | mid 250-2k {r(250,2000):6.1f} | pres 2-6k {r(2000,6000):6.1f} | hf>6k {r(6000,24000):6.1f}'
tl = json.load(open('build/timeline.json'))
secs = tl['sections'] + [{'name': 'end', 't': 30}]
for a, b in zip(secs, secs[1:]):
    seg = x[int(a['t']*sr):int(b['t']*sr)]
    if len(seg) > sr*0.2: print(f"{a['name']:6s} {a['t']:5.2f}-{b['t']:5.2f}  {bands(seg)}")
for f in sorted(glob.glob('build/stems/*.wav')):
    s, _ = sf.read(f); m = np.sqrt(np.mean(s**2, axis=1)) if s.ndim > 1 else np.abs(s)
    print(os.path.basename(f), 'rms dB', round(20*np.log10(np.sqrt(np.mean(s**2))+1e-12), 1), 'peak', round(20*np.log10(np.abs(s).max()+1e-12), 1))
