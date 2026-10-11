"""Sound-effect layer: one-shots from the local library (music/sfxlib.py) placed on the video's cues.

Each effect is levelled by its active loudness, so `db` is its place in the mix, comparable to engine.Part.level.
`align='peak'` lines up an effect's loudest moment with the cue (whooshes into a cut); `'onset'` starts it on the cue.
"""
import os
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt
from sfxlib import resolve

class Sfx:
    def __init__(self, dur, sr=48000):
        self.sr, self.N = sr, int(dur * sr)
        self.buf = np.zeros((self.N, 2)); self.cache = {}; self.log = []

    def _load(self, name):
        if name not in self.cache:
            x, r = sf.read(resolve(name), always_2d=True)                          # an alias or a library id
            if x.shape[1] == 1: x = np.repeat(x, 2, axis=1)
            if r != self.sr: x = resample_poly(x, self.sr, r, axis=0)
            m = np.abs(x).max(1); x = x[max(0, np.argmax(m > 0.02 * m.max()) - int(0.003 * self.sr)):]   # trim lead-in silence
            p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * self.sr); nb = max(1, len(p) // b)
            fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
            act = 10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))
            self.cache[name] = x * 10 ** (-act / 20)
        return self.cache[name]

    def play(self, t, name, db=-24.0, align='onset', rate=1.0, reverse=False, maxlen=None, pan=0.0):
        x = self._load(name)
        if rate != 1.0: x = resample_poly(x, 1000, int(round(1000 * rate)), axis=0)   # rate > 1: higher and shorter
        if reverse: x = x[::-1]
        if maxlen and len(x) > maxlen * self.sr:
            x = x[:int(maxlen * self.sr)].copy(); f = int(0.08 * self.sr); x[-f:] *= np.linspace(1, 0, f)[:, None]
        off = 0
        if align == 'peak':
            env = np.convolve(np.abs(x).max(1), np.ones(960) / 960, 'same'); off = int(np.argmax(env))
        i0 = int(t * self.sr) - off
        if pan: x = x * np.array([np.sqrt(1 - pan), np.sqrt(1 + pan)])
        a, b = max(0, i0), min(self.N, i0 + len(x))
        if b > a: self.buf[a:b] += x[a - i0:b - i0] * 10 ** (db / 20)
        self.log.append((round(t, 2), name, db))

    def mix(self, ir=None, verb=0.15, lp=None):
        """The SFX bus, with a touch of the score's reverb so effects sit in the same space; `lp` rounds off any fizz."""
        if lp: self.buf = sosfilt(butter(2, lp, 'low', fs=self.sr, output='sos'), self.buf, axis=0)
        if os.environ.get('STEM_DIR'):
            os.makedirs(os.environ['STEM_DIR'], exist_ok=True); sf.write(os.path.join(os.environ['STEM_DIR'], '_sfx.wav'), self.buf.astype(np.float32), self.sr)
        if ir is None: return self.buf
        wet = np.stack([fftconvolve(self.buf[:, ch], ir[:, ch])[:self.N] for ch in range(2)], axis=1)
        return self.buf + verb * wet
