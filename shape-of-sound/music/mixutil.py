"""Shared mix helpers for the vertical-video scores: soft transition swells, a gentle compressor and the master bus."""
import numpy as np
import pyloudnorm as pyln
from scipy.signal import butter, sosfilt

# velocity ceilings per (channel, note) so hits stay inside the music instead of jumping out of it
def cap_velocity(ch, p, v, dr, brass, timp, bass):
    if ch == dr:
        return min(v, {49: 70, 36: 98, 45: 92, 50: 90, 39: 88, 38: 86}.get(p, v))   # crash, kick, toms, clap, snare
    if ch == brass: return min(v, 88)
    if ch == timp: return min(v, 86)
    if ch == bass: return min(v, 96)
    return v

def swell(sr, rng, d=0.7, f0=220, f1=2200):
    """A soft band-limited air swell that rises into a cut and falls away quickly (peak normalised to 1)."""
    n = int(d * sr); w = rng.standard_normal(n); out = np.zeros(n)
    for i in range(0, n, 1024):
        fc = f0 * (f1 / f0) ** (i / n)
        out[i:i + 1024] = sosfilt(butter(2, [fc * 0.7, min(fc * 1.4, sr / 2 - 1)], 'band', fs=sr, output='sos'), w[i:i + 1024])
    k = np.arange(n) / n; a = 0.78
    env = np.where(k < a, np.sin(np.pi / 2 * k / a) ** 2, np.cos(np.pi / 2 * (k - a) / (1 - a)) ** 2)
    out *= env
    return out / (np.abs(out).max() + 1e-9)

def bloom(sr, d=1.6, f0=70, f1=40):
    """A low sine that swells in over ~60 ms instead of slamming (peak normalised to 1)."""
    t = np.arange(int(d * sr)) / sr
    s = np.sin(2 * np.pi * np.cumsum(np.geomspace(f0, f1, len(t))) / sr)
    return s * (1 - np.exp(-t / 0.06)) * np.exp(-t / 0.55)

def compress(x, sr, above_median_db=6.0, ratio=3.0, attack=0.012, release=0.3, block=0.005):
    """Block-RMS feed-forward compressor; the threshold sits a few dB above the track's median level."""
    m = np.sqrt(np.mean(x ** 2, axis=1))
    bs = int(block * sr); nb = len(m) // bs + 1
    lvl = 20 * np.log10(np.sqrt(np.mean(np.pad(m, (0, nb * bs - len(m))).reshape(nb, bs) ** 2, axis=1)) + 1e-9)
    thresh = np.median(lvl[lvl > -80]) + above_median_db
    target = np.maximum(0, lvl - thresh) * (1 - 1 / ratio)
    a, r = 1 - np.exp(-block / attack), 1 - np.exp(-block / release)
    gr = np.zeros(nb)
    for i in range(1, nb):
        k = a if target[i] > gr[i - 1] else r
        gr[i] = gr[i - 1] + (target[i] - gr[i - 1]) * k
    gain = np.interp(np.arange(len(m)), np.arange(nb) * bs + bs / 2, 10 ** (-gr / 20))
    return x * gain[:, None]

def tilt(x, sr, air=0.35, low_cut=0.2):
    """Gentle master EQ: lift presence above ~3 kHz and trim the sub below ~90 Hz (phone speakers can't use it)."""
    x = x + air * sosfilt(butter(1, 3000, 'high', fs=sr, output='sos'), x, axis=0)
    return x - low_cut * sosfilt(butter(2, 90, 'low', fs=sr, output='sos'), x, axis=0)

def master(x, sr, lufs=-16.0, ceiling_db=-1.5, eq=True):
    if eq: x = tilt(x, sr)
    x = compress(x, sr)
    meter = pyln.Meter(sr)
    x = pyln.normalize.loudness(x, meter.integrated_loudness(x), lufs)
    ceil = 10 ** (ceiling_db / 20); x = np.tanh(x / ceil) * ceil
    return x, meter.integrated_loudness(x), 20 * np.log10(np.abs(x).max())

def jumps(x, sr, top=6):
    """The biggest 0.2 s loudness jumps, for checking that nothing leaps out."""
    m = x.mean(1); win, hop = int(0.4 * sr), int(0.2 * sr)
    db = 20 * np.log10(np.array([np.sqrt(np.mean(m[i:i + win] ** 2) + 1e-12) for i in range(0, len(m) - win, hop)]))
    j = np.diff(db); idx = np.argsort(j)[-top:][::-1]
    return np.median(db), db.max(), [(round((i + 1) * 0.2, 1), round(float(j[i]), 1)) for i in idx]
