"""A natural, deep Chinese male narrator, made locally (no cloud TTS):
  · speech: CosyVoice-300M-Instruct (FunAudioLLM, Apache-2.0), speaker 中文男, steered by an English instruct prompt
    (a deep-voiced trailer narrator). It is a real recorded male voice, so no pitch shifting: the old Kokoro voice taken
    down 2.5 semitones was judged ugly and unnatural. The model runs in its own Python environment through
    music/cosy_tts.py; set COSYVOICE_PY (that environment's python), COSYVOICE_DIR (the CosyVoice clone with the model
    in pretrained_models/CosyVoice-300M-Instruct) and, if needed, COSYVOICE_STUBS (extra import paths).
  · takes: the model samples, so a take can drop or slur a word. Every line is rendered with a few seeds and each take
    is transcribed back with SenseVoice (set SENSEVOICE_DIR,
    https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2);
    the take whose transcript matches the script best (compared as toneless pinyin, so homophones the recogniser
    guesses don't count) is kept.
  · a light broadcast chain: rumble cut, a little chest and presence, gentle compression, an optional hall tail.
Usage (from another script): from voice import takes; clips = takes([{"text": "这一周，AI 圈像一部谍战片。"}], cache_dir)"""
import difflib, hashlib, json, os, re, subprocess, sys, tempfile
import numpy as np, soundfile as sf
from scipy.signal import butter, fftconvolve, lfilter, resample_poly, sosfilt

SR = 48000
SENSE = os.environ.get('SENSEVOICE_DIR', '')
COSY_PY = os.environ.get('COSYVOICE_PY', 'python3')
INSTRUCT = 'A deep-voiced male movie trailer narrator, low pitch, intense and dramatic, speaking at a brisk pace.<|endofprompt|>'
_asr = _ir = None

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

def polish(x, sr, hall=0.0):
    """the broadcast chain (mono float32 at 48 kHz, leading silence trimmed to 40 ms, hall tail included)"""
    g = np.gcd(SR, sr); y = resample_poly(x.astype(np.float64), SR // g, sr // g)
    y = sosfilt(butter(2, 65, 'high', fs=SR, output='sos'), y)
    y = _peq(y, 130, 2.0, 0.9); y = _peq(y, 380, -2.0, 1.1); y = _peq(y, 3200, 2.0, 0.9)
    # level by the speech, not the peak: TTS takes come out at different levels
    act = np.abs(y) > 0.05 * np.abs(y).max(); rms = np.sqrt(np.mean(y[act] ** 2)) if act.any() else 1.0
    y = _comp(y * (0.12 / (rms + 1e-9)), thr_db=-20, ratio=2.5); y = np.tanh(1.2 * y) / np.tanh(1.2)
    if hall > 0:
        global _ir
        if _ir is None: _ir = _hall()
        w = fftconvolve(y, _ir)[:len(y) + int(1.2 * SR)]; y = np.concatenate([y, np.zeros(len(w) - len(y))]) + hall * w / (np.abs(w).max() + 1e-9) * 0.5
    lead = np.argmax(np.abs(y) > 0.01 * np.abs(y).max()); y = y[max(0, lead - int(0.04 * SR)):]
    return np.clip(y, -0.98, 0.98).astype(np.float32)

def hear(x, sr=SR, stamps=False):
    """what an ASR model hears in x (no inverse text normalisation, so numbers come back as characters); with
    stamps=True also the recognised tokens and their start times in seconds"""
    global _asr
    if not SENSE: return ('', [], []) if stamps else ''
    if _asr is None:
        import sherpa_onnx
        _asr = sherpa_onnx.OfflineRecognizer.from_sense_voice(model=f'{SENSE}/model.int8.onnx', tokens=f'{SENSE}/tokens.txt', language='zh', use_itn=False, num_threads=4)
    y = resample_poly(x, 16000, sr).astype(np.float32); s = _asr.create_stream(); s.accept_waveform(16000, y); _asr.decode_stream(s)
    return (s.result.text, list(s.result.tokens), list(s.result.timestamps)) if stamps else s.result.text

def _sounds(s):
    """a text as toneless pinyin syllables, with Latin letters lower-cased and run together per word (the recogniser
    spells "AI" as "A I"), and digits read as Chinese numerals"""
    from pypinyin import lazy_pinyin
    s = re.sub(r'(?<=[A-Za-z]) +(?=[A-Za-z])', '', s); s = re.sub(r'\d', lambda m: '零一二三四五六七八九'[int(m.group())], s)
    out = []
    for tok in re.findall(r'[一-鿿]|[A-Za-z]+|\d', s):
        out += [tok.lower()] if tok.isascii() else lazy_pinyin(tok)
    return out
def match(script, heard):
    """0..1: how much of the script the recogniser heard, by sound"""
    a, b = _sounds(script), _sounds(heard)
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio() if a else 0.0

def char_times(script, x, sr=SR):
    """when each character of the script is spoken in x (seconds): the recogniser's token times aligned to the script
    by sound; characters it didn't hear are interpolated. Punctuation and spaces get the time of the next sound."""
    _, toks, ts = hear(x, sr, stamps=True)
    units = [(i, u) for i, c in enumerate(script) for u in ([c] if '\u4e00' <= c <= '\u9fff' or c.isdigit() else [])]
    # Latin words count as one unit, placed at their first letter
    for m in re.finditer(r'[A-Za-z]+', script): units.append((m.start(), m.group()))
    units.sort()
    a = [_sounds(u)[0] if _sounds(u) else u.lower() for _, u in units]
    heard = [(t, tt) for t, tt in zip(toks, ts) if _sounds(t)]
    b = [_sounds(t)[0] for t, _ in heard]
    known = {}
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for k in range(blk.size): known[blk.a + k] = heard[blk.b + k][1]
    tl = [known.get(k) for k in range(len(units))]
    idx = [k for k, v in enumerate(tl) if v is not None]
    if idx:
        tl = list(np.interp(range(len(units)), idx, [tl[k] for k in idx]))
    else:
        tl = list(np.linspace(0, len(x) / sr, len(units), endpoint=False))
    out = [None] * len(script); pos = {i: v for (i, _), v in zip(units, tl)}
    nxt = len(x) / sr
    for i in range(len(script) - 1, -1, -1):
        if i in pos: nxt = pos[i]
        out[i] = round(float(nxt), 3)
    return out

def voiced_end(x, thr=0.03):
    """seconds until the last sample above thr × peak (the end of speech, before the hall tail)"""
    idx = np.nonzero(np.abs(x) > thr * np.abs(x).max())[0]; return (idx[-1] + 1) / SR if len(idx) else 0.0

def _cosy(jobs):
    if not jobs: return
    here = os.path.dirname(os.path.abspath(__file__))
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8') as f: json.dump(jobs, f, ensure_ascii=False); p = f.name
    try: subprocess.run([COSY_PY, '-I', os.path.join(here, 'cosy_tts.py'), p], check=True)
    finally: os.unlink(p)

def takes(lines, cache, seeds=(1, 2, 3, 4, 5), accept=0.93, instruct=INSTRUCT):
    """lines: [{text, speed?, hall?}]. Renders seed after seed until each line has a take the recogniser hears as the
    script (match ≥ accept), keeps the best take of each, and returns [{audio (48 kHz, polished), heard, score, seed}]."""
    os.makedirs(cache, exist_ok=True); best = [None] * len(lines)
    def raw(L, seed):
        key = hashlib.md5(json.dumps([L['text'], L.get('speed', 1.0), instruct, seed], ensure_ascii=False).encode()).hexdigest()[:12]
        return os.path.join(cache, key + '.wav')
    for seed in seeds:
        todo = [i for i, b in enumerate(best) if b is None or b['score'] < accept]
        if not todo: break
        _cosy([{'text': lines[i]['text'], 'instruct': instruct, 'seed': seed, 'speed': lines[i].get('speed', 1.0), 'out': raw(lines[i], seed)} for i in todo])
        for i in todo:
            x, sr = sf.read(raw(lines[i], seed), dtype='float32'); heard = hear(x, sr); sc = match(lines[i]['text'], heard)
            print(f'  seed {seed} {sc:.2f} {lines[i]["text"]} → {heard}', file=sys.stderr)
            if best[i] is None or sc > best[i]['score']: best[i] = {'raw': (x, sr), 'heard': heard, 'score': sc, 'seed': seed}
    return [{'audio': polish(*b['raw'], hall=L.get('hall', 0.0)), 'heard': b['heard'], 'score': b['score'], 'seed': b['seed']} for b, L in zip(best, lines)]
