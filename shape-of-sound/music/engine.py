"""Hybrid score renderer for the vertical videos.

Soundfont instruments (MuseScore General, Salamander piano, FreePats glass/kalimba) are rendered per stem with FluidSynth,
modern synth parts are generated in numpy, drums come from drum-machine one-shots, and everything meets in one
convolution reverb. Each stem is levelled by its active loudness, so a part's `level` is its place in the mix in dB.
Fetch the sample libraries first: bash music/fetch_sounds.sh
"""
import os, subprocess, tempfile
from collections import defaultdict
import mido
import numpy as np
import soundfile as sf
from scipy.signal import butter, fftconvolve, sosfilt

HERE = os.path.dirname(os.path.abspath(__file__))
SND = os.path.join(HERE, 'sounds')
FONTS = {
    'ms': 'MuseScore_General.sf3',
    'piano': 'salamander/SalamanderGrandPiano-SF2-V3+20200602/SalamanderGrandPiano-V3+20200602.sf2',
    'glass': 'glass/Glass-SF2-20191227/Glass-20191227.sf2',
    'kalimba': 'kalimba/Kalimba-SF2-20190723/Kalimba-20190723.sf2',
}
hz = lambda p: 440.0 * 2 ** ((p - 69) / 12)

class Part:
    def __init__(self, level=0.0, pan=0.0, verb=0.25, cap=127, hp=None, lp=None, duck=0.0):
        self.level, self.pan, self.verb, self.cap, self.hp, self.lp, self.duck = level, pan, verb, cap, hp, lp, duck

class SF2(Part):
    def __init__(self, font, program=0, drum=False, **kw):
        super().__init__(**kw); self.font, self.program, self.drum = font, program, drum

class Synth(Part):
    def __init__(self, kind, **kw):
        self.opts = {k: kw.pop(k) for k in list(kw) if k not in ('level', 'pan', 'verb', 'cap', 'hp', 'lp', 'duck')}
        super().__init__(**kw); self.kind = kind

DRUM_CAPS = {49: 70, 36: 98, 45: 92, 47: 92, 50: 90, 39: 88, 38: 86}
class Drums(Part):
    """One-shots for the core kit; anything else (crash, ride, clap, rim, woodblock) falls back to a soundfont kit."""
    def __init__(self, samples, fallback_kit=25, **kw):
        super().__init__(**kw); self.samples, self.fallback_kit = samples, fallback_kit

# ───────────── synth voices (each returns a stereo buffer)
def _rel_env(n_on, n_total, sr, attack, release):
    e = np.ones(n_total)
    na = max(1, int(attack * sr)); e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    if n_total > n_on: e[n_on:] = e[min(n_on, n_total) - 1] * np.exp(-np.arange(n_total - n_on) / (release * sr / 5))
    return e

def _saw(f, t, cutoff, kmax=28):
    K = max(1, min(kmax, int(cutoff * 3 / f)))
    k = np.arange(1, K + 1)[:, None]
    amp = (1 / k) / (1 + (k * f / cutoff) ** 2)
    return (amp * np.sin(2 * np.pi * k * f * t[None, :] + k * 1.7)).sum(0)

def v_pad(f, dur, vel, sr, rng, cutoff=1500, attack=0.45, release=1.1, detune=(-11, -4, 0, 4, 11)):
    n_on, n = int(dur * sr), int((dur + release) * sr); t = np.arange(n) / sr
    out = np.zeros((n, 2)); pans = np.linspace(-0.85, 0.85, len(detune))
    for c, pn in zip(detune, pans):
        s = _saw(f * 2 ** (c / 1200), t + rng.uniform(0, 1), cutoff)
        out[:, 0] += s * np.sqrt((1 - pn) / 2); out[:, 1] += s * np.sqrt((1 + pn) / 2)
    return out * _rel_env(n_on, n, sr, attack, release)[:, None] / len(detune)

def v_pluck(f, dur, vel, sr, rng, bright=1.0, decay=2.2, length=1.4):
    n = int((min(dur, length) + 0.5) * sr); t = np.arange(n) / sr
    K = max(1, min(24, int(7000 / f))); k = np.arange(1, K + 1)[:, None]
    out = np.zeros((n, 2))
    for ch, c in ((0, -4), (1, 4)):
        ff = f * 2 ** (c / 1200)
        out[:, ch] = ((1 / k) * np.exp(-t[None, :] * (decay + 1.6 * k / bright)) * np.sin(2 * np.pi * k * ff * t[None, :])).sum(0)
    out *= (1 - np.exp(-t / 0.002))[:, None]
    n_off = int(dur * sr)
    if n_off < n: out[n_off:] *= np.exp(-np.arange(n - n_off) / (0.08 * sr))[:, None]
    return out

def v_sub(f, dur, vel, sr, rng, drive=2.2, grit=0.35):
    n_on, n = int(dur * sr), int((dur + 0.15) * sr); t = np.arange(n) / sr
    s = np.sin(2 * np.pi * f * t)
    s = s + grit * np.tanh(drive * s)                       # odd harmonics so phones still hear the bass
    e = _rel_env(n_on, n, sr, 0.006, 0.15) * np.exp(-t / 3.0)
    return np.repeat((s * e)[:, None], 2, axis=1)

def v_bell(f, dur, vel, sr, rng, ratio=3.5, index=2.2, decay=1.8):
    n = int(max(dur, 2.8) * sr); t = np.arange(n) / sr
    I = index * np.exp(-t / 0.35)
    out = np.zeros((n, 2))
    for ch, c in ((0, -3), (1, 3)):
        ff = f * 2 ** (c / 1200)
        out[:, ch] = np.sin(2 * np.pi * ff * t + I * np.sin(2 * np.pi * ff * ratio * t)) + 0.25 * np.sin(2 * np.pi * ff * 2.001 * t) * np.exp(-t / 0.6)
    return out * (np.exp(-t / decay) * (1 - np.exp(-t / 0.002)))[:, None]

VOICES = {'pad': v_pad, 'pluck': v_pluck, 'sub': v_sub, 'bell': v_bell}

# ───────────── the score
class Score:
    def __init__(self, dur, sr=48000, seed=0):
        self.dur, self.sr = dur, sr; self.N = int(dur * sr); self.rng = np.random.default_rng(seed)
        self.ev = defaultdict(list)

    def note(self, part, s, d, p, v=90):
        if s >= self.dur: return
        self.ev[part].append((s, max(0.03, d), int(p), int(max(1, min(127, v + self.rng.integers(-3, 4))))))

    def chord(self, part, s, d, ps, v=85):
        for p in ps: self.note(part, s, d, p, v)

    # ── stems
    def _fluid(self, font, evs, program, drum, work, tag):
        ch = 9 if drum else 0
        mid = mido.MidiFile(ticks_per_beat=480); trk = mido.MidiTrack(); mid.tracks.append(trk)
        trk.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(120), time=0))
        trk.append(mido.Message('program_change', channel=ch, program=program, time=0))
        msgs = []
        for s, d, p, v in evs:
            msgs.append((int(round(s * 960)), 1, mido.Message('note_on', channel=ch, note=p, velocity=v)))
            msgs.append((int(round((s + d) * 960)), 0, mido.Message('note_off', channel=ch, note=p, velocity=0)))
        last = 0
        for tk, _, m in sorted(msgs, key=lambda x: (x[0], x[1])): trk.append(m.copy(time=tk - last)); last = tk
        mp, wp = os.path.join(work, tag + '.mid'), os.path.join(work, tag + '.wav')
        mid.save(mp)
        subprocess.run(['fluidsynth', '-ni', '-q', '-g', '0.8', '-r', str(self.sr), '-R', '0', '-C', '0', '-F', wp, os.path.join(SND, FONTS[font]), mp], check=True)
        x, _ = sf.read(wp, always_2d=True)
        return np.pad(x, ((0, max(0, self.N - len(x))), (0, 0)))[:self.N]

    def _place(self, buf, s, sig, gain):
        i0 = int(s * self.sr)
        if i0 >= self.N: return
        seg = sig[:self.N - i0]; buf[i0:i0 + len(seg)] += seg * gain

    def _stem(self, name, part, work):
        evs = [(s, d, p, min(v, part.cap)) for s, d, p, v in self.ev[name]]
        if isinstance(part, SF2):
            return self._fluid(part.font, evs, part.program, part.drum, work, name)
        buf = np.zeros((self.N, 2))
        if isinstance(part, Synth):
            for s, d, p, v in evs:
                self._place(buf, s, VOICES[part.kind](hz(p), d, v, self.sr, self.rng, **part.opts), (v / 127) ** 1.7)
            return buf
        # drums
        rest = []
        cache = {}
        for s, d, p, v in evs:
            v = min(v, DRUM_CAPS.get(p, 127))
            key = part.samples.get(p)
            if key is None: rest.append((s, d, p, v)); continue
            if key not in cache:
                x, _ = sf.read(os.path.join(SND, 'drums', key + '.wav'), always_2d=True); cache[key] = x / (np.abs(x).max() + 1e-9)
            self._place(buf, s, cache[key], (v / 127) ** 1.6)
        if rest:
            fb = self._fluid('ms', rest, part.fallback_kit, True, work, name + '_fb')
            ref = np.abs(buf).max() or 1.0
            buf += fb / (np.abs(fb).max() + 1e-9) * 0.6 * ref
        return buf

    @staticmethod
    def _active_db(x, sr):
        m = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * sr); nb = len(m) // b
        if nb == 0: return -120.0
        fr = 20 * np.log10(np.sqrt(np.mean(m[:nb * b].reshape(nb, b) ** 2, axis=1)) + 1e-12)
        act = fr[fr > fr.max() - 30]
        return 10 * np.log10(np.mean(10 ** (act / 10)))

    def _ir(self, rt=2.6, predelay=0.025):
        n = int(rt * 1.2 * self.sr); t = np.arange(n) / self.sr
        ir = np.zeros((n + int(predelay * self.sr), 2))
        for ch in range(2):
            w = self.rng.standard_normal(n)
            lo = sosfilt(butter(2, 1500, 'low', fs=self.sr, output='sos'), w) * np.exp(-6.9 * t / rt)
            hi = sosfilt(butter(2, 1500, 'high', fs=self.sr, output='sos'), w) * np.exp(-6.9 * t / (rt * 0.45))
            ir[int(predelay * self.sr):, ch] = sosfilt(butter(1, 180, 'high', fs=self.sr, output='sos'), lo + 0.6 * hi)
        return ir / np.sqrt(np.sum(ir ** 2) / 2)

    def render(self, parts, verb_return=0.35, kick_part=None):
        stems = {}
        with tempfile.TemporaryDirectory() as work:
            for name, part in parts.items():
                if not self.ev.get(name): continue
                x = self._stem(name, part, work)
                if part.hp: x = sosfilt(butter(2, part.hp, 'high', fs=self.sr, output='sos'), x, axis=0)
                if part.lp: x = sosfilt(butter(2, part.lp, 'low', fs=self.sr, output='sos'), x, axis=0)
                x = x * 10 ** ((part.level - self._active_db(x, self.sr)) / 20)
                if part.pan:
                    x[:, 0] *= np.sqrt((1 - part.pan) / 2) * np.sqrt(2); x[:, 1] *= np.sqrt((1 + part.pan) / 2) * np.sqrt(2)
                stems[name] = x
        # kick ducking for pads and bass
        if kick_part and kick_part in self.ev:
            duck = np.zeros(self.N); t = np.arange(int(0.35 * self.sr)) / self.sr; shape = np.exp(-t / 0.12)
            for s, d, p, v in self.ev[kick_part]:
                if p == 36: i0 = int(s * self.sr); seg = shape[:max(0, self.N - i0)]; duck[i0:i0 + len(seg)] = np.maximum(duck[i0:i0 + len(seg)], seg * v / 127)
            for name, part in parts.items():
                if part.duck and name in stems: stems[name] = stems[name] * (1 - part.duck * duck)[:, None]
        if os.environ.get('STEM_DIR'):                  # debugging aid: write every levelled stem
            os.makedirs(os.environ['STEM_DIR'], exist_ok=True)
            for n, x in stems.items(): sf.write(os.path.join(os.environ['STEM_DIR'], n + '.wav'), x.astype(np.float32), self.sr)
        dry = sum(stems.values())
        send = sum(stems[n] * parts[n].verb for n in stems)
        ir = self._ir()
        wet = np.stack([fftconvolve(send[:, ch], ir[:, ch])[:self.N] for ch in range(2)], axis=1)
        return dry + verb_return * wet, stems
