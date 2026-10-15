"""A deep, dramatic Chinese narrator, made locally (no cloud TTS):
  · speech: sherpa-onnx + Kokoro v1.1-zh (Apache-2.0), speaker 58 — a low male voice that reads "AI" as letters.
    Model: https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-multi-lang-v1_1.tar.bz2
    Set KOKORO_DIR to the unpacked folder.
  · a trailer-narrator chain: pitch and formants down ~3 semitones, a touch slower, chest boosted, mud cut, hard
    compression, gentle saturation, an optional hall tail.
  · a check by ear we can't do ourselves: every line is transcribed back with SenseVoice (set SENSEVOICE_DIR,
    https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2)
    and printed next to the script, so mispronunciations show up before the edit.
Usage (from another script): from voice import narrate; x = narrate("这一周，AI 世界又不平静。")"""
import os, subprocess, tempfile
import numpy as np, soundfile as sf
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

SR = 48000
KOKORO = os.environ.get('KOKORO_DIR', '')
SENSE = os.environ.get('SENSEVOICE_DIR', '')
SPEAKER = 58
_tts = _asr = _ir = None

def _engine():
    global _tts
    if _tts is None:
        import sherpa_onnx
        D = KOKORO
        cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=f'{D}/model.onnx', voices=f'{D}/voices.bin', tokens=f'{D}/tokens.txt', data_dir=f'{D}/espeak-ng-data', dict_dir=f'{D}/dict',
            lexicon=f'{D}/lexicon-us-en.txt,{D}/lexicon-zh.txt'), num_threads=4), rule_fsts=f'{D}/date-zh.fst,{D}/phone-zh.fst,{D}/number-zh.fst', max_num_sentences=1)
        _tts = sherpa_onnx.OfflineTts(cfg)
    return _tts

def speak(text, speed=0.9, sid=SPEAKER):
    a = _engine().generate(text, sid=sid, speed=speed); return np.array(a.samples, dtype=np.float32), a.sample_rate

def _peq(x, f0, gain_db, q):
    A = 10 ** (gain_db / 40); w = 2 * np.pi * f0 / SR; al = np.sin(w) / (2 * q)
    b = np.array([1 + al * A, -2 * np.cos(w), 1 - al * A]); a = np.array([1 + al / A, -2 * np.cos(w), 1 - al / A]); return lfilter(b / a[0], a / a[0], x)
def _comp(x, thr_db=-22, ratio=4.0, att=0.004, rel=0.12):
    a1, r1 = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR)); e = np.empty_like(x); v = 0.0
    for i, s in enumerate(np.abs(x)):
        v = a1 * v + (1 - a1) * s if s > v else r1 * v + (1 - r1) * s; e[i] = v
    over = np.maximum(0, 20 * np.log10(e + 1e-9) - thr_db); return x * 10 ** (-over * (1 - 1 / ratio) / 20)
def _hall(sec=1.6, seed=3):
    n = int(sec * SR); t = np.arange(n) / SR; ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-t / (sec / 5.5))
    ir = sosfilt(butter(2, 3500, 'low', fs=SR, output='sos'), ir); ir[:int(0.012 * SR)] = 0; return ir / np.abs(ir).max()

def deepen(x, sr, semis=-3.0, slow=0.94, hall=0.10):
    """the trailer-narrator chain (returns mono float32 at 48 kHz, tail included)"""
    r = 2 ** (semis / 12)
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, 'a.wav'), os.path.join(d, 'b.wav'); sf.write(a, x, sr)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a, '-af', f'asetrate={int(sr * r)},aresample={SR},atempo={(1 / r) * slow:.5f}', '-ar', str(SR), '-ac', '1', b], check=True)
        y, _ = sf.read(b, dtype='float64')
    y = sosfilt(butter(2, 55, 'high', fs=SR, output='sos'), y)
    y = _peq(y, 140, 4.5, 0.8); y = _peq(y, 420, -3.0, 1.0); y = _peq(y, 2800, 1.5, 0.9)
    y = sosfilt(butter(2, 9000, 'low', fs=SR, output='sos'), y)
    y = _comp(y / (np.abs(y).max() + 1e-9) * 0.7); y = np.tanh(1.6 * y) / np.tanh(1.6)
    if hall > 0:
        global _ir
        if _ir is None: _ir = _hall()
        w = fftconvolve(y, _ir)[:len(y) + int(1.2 * SR)]; y = np.concatenate([y, np.zeros(len(w) - len(y))]) + hall * w / (np.abs(w).max() + 1e-9) * 0.7
    # trim leading silence to 20 ms so cue times are exact
    lead = np.argmax(np.abs(y) > 0.02 * np.abs(y).max()); y = y[max(0, lead - int(0.02 * SR)):]
    return (y / (np.abs(y).max() + 1e-9) * 0.89).astype(np.float32)

def narrate(text, speed=0.9, semis=-3.0, slow=0.94, hall=0.10):
    x, sr = speak(text, speed); return deepen(x, sr, semis, slow, hall)

def hear(x, sr=SR):
    """what an ASR model hears in x (to catch mispronunciations)"""
    global _asr
    if not SENSE: return ''
    if _asr is None:
        import sherpa_onnx
        _asr = sherpa_onnx.OfflineRecognizer.from_sense_voice(model=f'{SENSE}/model.int8.onnx', tokens=f'{SENSE}/tokens.txt', language='zh', use_itn=True, num_threads=4)
    y = resample_poly(x, 16000, sr).astype(np.float32); s = _asr.create_stream(); s.accept_waveform(16000, y); _asr.decode_stream(s); return s.result.text

def voiced_end(x, thr=0.03):
    """seconds until the last sample above thr × peak (the end of speech, before the hall tail)"""
    idx = np.nonzero(np.abs(x) > thr * np.abs(x).max())[0]; return (idx[-1] + 1) / SR if len(idx) else 0.0
