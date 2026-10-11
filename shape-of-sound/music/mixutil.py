"""Shared mix helpers for the vertical-video scores: a gentle compressor, a tilt EQ and the master bus."""
import numpy as np
import pyloudnorm as pyln
from scipy.signal import butter, sosfilt

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
