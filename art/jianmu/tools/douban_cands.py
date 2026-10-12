"""Reference research helper (study only): list a Douban subject's stills and download small previews into a
candidate folder, then build a numbered contact sheet so the best references can be chosen by eye.

  python3 tools/douban_cands.py <kind tv|movie> <subject id> <tag> <outdir> [count]
"""
import json, os, subprocess, sys, time, urllib.request

kind, sid, tag, out = sys.argv[1:5]
count = int(sys.argv[5]) if len(sys.argv) > 5 else 40
H = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)', 'Referer': 'https://m.douban.com/movie/'}
url = f'https://m.douban.com/rexxar/api/v2/{kind}/{sid}/photos?count={count}&start=0'
d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=30))
os.makedirs(out, exist_ok=True)
idx = []
for i, p in enumerate(d.get('photos', [])):
    u = p['image']['normal']['url']; L = p['image']['large']['url']
    f = os.path.join(out, f'{tag}_{i:02d}.jpg')
    if not os.path.exists(f):
        try:
            data = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://movie.douban.com/'}), timeout=30).read()
            open(f, 'wb').write(data)
        except Exception as e:
            print('skip', u, e); continue
        time.sleep(0.15)
    idx.append({'i': i, 'file': f, 'large': L, 'desc': p.get('description', ''), 'w': p['image']['large']['width'], 'h': p['image']['large']['height']})
json.dump(idx, open(os.path.join(out, f'{tag}_index.json'), 'w'), ensure_ascii=False, indent=1)
files = []
for it in idx:
    files += ['-label', f"{it['i']}", it['file']]
subprocess.run(['montage', '-pointsize', '14', '-fill', 'white', '-background', '#222'] + files +
               ['-geometry', '240x135+2+2', '-tile', '8x', os.path.join(out, f'{tag}_sheet.jpg')], check=True)
print(tag, len(idx), 'of', d.get('total'))
