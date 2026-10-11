"""Local sound-effect library.

The catalog (music/sfx_catalog.json, committed) lists every effect with its source, licence, categories, tags and an
analysis (duration, onset, peak, loudness, brightness). The audio lives in music/sounds/sfx/lib/<id>.wav (gitignored).
Short names used by the scores are aliases in music/sfx_aliases.json.

  python3 music/sfxlib.py index              # scrape Mixkit categories into the catalog
  python3 music/sfxlib.py fetch [--max 12]   # download + analyse everything up to 12 s
  python3 music/sfxlib.py search whoosh soft [--cat whoosh] [--max 3]
  python3 music/sfxlib.py audition 1489 2623 switch -o out/audition.wav   # ids or aliases, 0.6 s apart
  python3 music/sfxlib.py alias switch 2585
"""
import argparse, concurrent.futures as cf, html, json, os, re, subprocess, sys, urllib.request
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
CATALOG, ALIASES = os.path.join(HERE, 'sfx_catalog.json'), os.path.join(HERE, 'sfx_aliases.json')
LIB = os.path.join(HERE, 'sounds', 'sfx', 'lib')
UA = {'User-Agent': 'Mozilla/5.0'}
LICENSE = 'Mixkit Sound Effects Free License (free for commercial use, no attribution; do not redistribute standalone)'
# the Mixkit categories that matter for explainer videos, grouped into our own families
FAMILIES = {
    'whoosh': ['whoosh', 'woosh', 'swoosh', 'swish', 'sweep', 'sweeping', 'transition', 'zoom', 'slide', 'rewind'],
    'impact': ['impact', 'hit', 'thud', 'boom', 'stomp', 'cinematic', 'intro', 'bass'],
    'swell': ['swell', 'drone', 'hum', 'suspense-music'],
    'shimmer': ['sparkle', 'magic', 'fairy', 'spell', 'chimes', 'ding', 'bell', 'glass'],
    'ui': ['click', 'interface', 'notification', 'pop', 'tap', 'beep', 'bleep', 'tones', 'correct', 'win', 'wow', 'countdown', 'clock', 'camera', 'page', 'paper', 'typewriter', 'type', 'keyboard', 'mouse', 'lock', 'key'],
    'tech': ['technology', 'high-tech', 'sci-fi', 'electricity', 'static', 'glitch', 'laser', 'robot', 'time-machine', 'tape-machine'],
    'nature': ['water', 'drop', 'bubbles', 'splash', 'rain', 'wind', 'ocean', 'waves', 'thunder', 'lightning', 'fire', 'insect', 'squeak'],
    'body': ['heartbeat', 'breathe', 'gasp', 'applause', 'cheer', 'crowd'],
    'space': ['rocket', 'asteroid'],
}

def load(path, default):
    return json.load(open(path, encoding='utf-8')) if os.path.exists(path) else default
def save(path, obj):
    json.dump(obj, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1, sort_keys=True)

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r: return r.read()

def cmd_index(a):
    cat = load(CATALOG, {})
    for fam, slugs in FAMILIES.items():
        for slug in slugs:
            try: page = get(f'https://mixkit.co/free-sound-effects/{slug}/').decode('utf-8', 'ignore')
            except Exception as e: print('skip', slug, e); continue
            n = 0
            for blk in page.split('class="item-grid__item"')[1:]:
                m = re.search(r'sfx/(\d+)/\d+-preview\.mp3', blk)
                if not m: continue
                i = m.group(1); t = re.search(r'item-grid-card__title[^>]*>\s*([^<]+?)\s*<', blk)
                d = re.search(r'(\d+):(\d\d)', blk)
                e = cat.setdefault(i, {'id': int(i), 'source': 'mixkit', 'license': LICENSE, 'url': f'https://assets.mixkit.co/active_storage/sfx/{i}/{i}.wav',
                                       'title': html.unescape(t.group(1)) if t else '?', 'listed_dur': int(d.group(1)) * 60 + int(d.group(2)) if d else None,
                                       'families': [], 'mixkit_cats': []})
                if fam not in e['families']: e['families'].append(fam)
                if slug not in e['mixkit_cats']: e['mixkit_cats'].append(slug)
                e['tags'] = sorted(set(re.findall(r'[a-z]+', e['title'].lower())) | set(e['mixkit_cats']) | set(e['families']))
                n += 1
            print(f'{fam:8s} {slug:16s} {n}')
    save(CATALOG, cat); print(len(cat), 'effects in catalog')

def analyse(path):
    x, sr = sf.read(path, always_2d=True); m = np.abs(x).max(1)
    env = np.convolve(m, np.ones(960) / 960, 'same')
    p = np.sqrt(np.mean(x ** 2, axis=1)); b = int(0.05 * sr); nb = max(1, len(p) // b)
    fr = 20 * np.log10(np.sqrt(np.mean(p[:nb * b].reshape(nb, -1) ** 2, axis=1)) + 1e-12)
    S = np.abs(np.fft.rfft(x.mean(1))); f = np.fft.rfftfreq(len(x), 1 / sr)
    return {'dur': round(len(x) / sr, 2), 'onset': round(float(np.argmax(m > 0.05 * m.max())) / sr, 3), 'peak': round(float(np.argmax(env)) / sr, 3),
            'active_db': round(float(10 * np.log10(np.mean(10 ** (fr[fr > fr.max() - 30] / 10)))), 1),
            'brightness_hz': int((S * f).sum() / (S.sum() + 1e-12))}

def fetch_one(e):
    dst = os.path.join(LIB, f"{e['id']}.wav")
    if not os.path.exists(dst):
        src = dst + '.src'
        try:
            open(src, 'wb').write(get(e['url']))
            subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', src, '-ar', '48000', '-ac', '2', dst], check=True)
        except Exception as ex:
            return e['id'], None, str(ex)[:60]
        finally:
            if os.path.exists(src): os.remove(src)
    return e['id'], analyse(dst), None

def cmd_fetch(a):
    os.makedirs(LIB, exist_ok=True); cat = load(CATALOG, {})
    for name, i in load(ALIASES, {}).items():                # aliases the scores use must always be present
        cat.setdefault(str(i), {'id': i, 'source': 'mixkit', 'license': LICENSE, 'url': f'https://assets.mixkit.co/active_storage/sfx/{i}/{i}.wav',
                                'title': name.replace('_', ' '), 'listed_dur': 0, 'families': [], 'mixkit_cats': [], 'tags': name.split('_')})
    todo = [e for e in cat.values() if (e.get('listed_dur') or 0) <= a.max]
    with cf.ThreadPoolExecutor(8) as ex:
        for i, an, err in ex.map(fetch_one, todo):
            if an: cat[str(i)].update(an); cat[str(i)]['local'] = True
            else: cat[str(i)]['local'] = False; print('failed', i, err)
    save(CATALOG, cat); print(sum(1 for e in cat.values() if e.get('local')), 'effects available locally')

def resolve(key):
    al = load(ALIASES, {}); key = str(al.get(key, key))
    return os.path.join(LIB, key + '.wav')

def cmd_search(a):
    cat = load(CATALOG, {}); words = [w.lower() for w in a.words]
    hits = [e for e in cat.values() if e.get('local') and all(any(w in t for t in e['tags']) for w in words)
            and (not a.cat or a.cat in e['families']) and e.get('dur', 99) <= a.max]
    al = {str(v): k for k, v in load(ALIASES, {}).items()}
    for e in sorted(hits, key=lambda e: e['dur'])[:a.n]:
        print(f"{e['id']:>5} {e['dur']:5.2f}s peak {e['peak']:4.2f}s {e['brightness_hz']:>5}Hz  {','.join(e['families']):14s} {e['title']}" + (f"  [{al[str(e['id'])]}]" if str(e['id']) in al else ''))
    print(len(hits), 'matches')

def cmd_audition(a):
    parts, t, cues = [], 0.0, []
    for k in a.keys:
        x, sr = sf.read(resolve(k), always_2d=True); cues.append(f'{t:6.2f}s  {k}')
        parts += [x, np.zeros((int(0.6 * sr), 2))]; t += len(x) / sr + 0.6
    y = np.concatenate(parts); y = y / (np.abs(y).max() + 1e-9) * 0.8
    os.makedirs(os.path.dirname(os.path.abspath(a.o)), exist_ok=True); sf.write(a.o, y.astype(np.float32), 48000)
    print('\n'.join(cues)); print('wrote', a.o)

def cmd_alias(a):
    al = load(ALIASES, {}); al[a.name] = int(a.id); save(ALIASES, al); print(a.name, '→', a.id)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='cmd', required=True)
    sp.add_parser('index')
    f = sp.add_parser('fetch'); f.add_argument('--max', type=float, default=12)
    s = sp.add_parser('search'); s.add_argument('words', nargs='*'); s.add_argument('--cat'); s.add_argument('--max', type=float, default=99); s.add_argument('-n', type=int, default=40)
    u = sp.add_parser('audition'); u.add_argument('keys', nargs='+'); u.add_argument('-o', default=os.path.join(HERE, '..', 'out', 'audition.wav'))
    l = sp.add_parser('alias'); l.add_argument('name'); l.add_argument('id')
    a = ap.parse_args(); globals()['cmd_' + a.cmd](a)
