"""Reference research helper (study only): search ArtStation and download previews of the results into a candidate
folder with a numbered contact sheet. Image assets are fetched at `large` size; cover-only results at their square size.

  python3 tools/artstation_cands.py "<query>" <tag> <outdir> [count]
"""
import json, os, subprocess, sys, time, urllib.parse, urllib.request

q, tag, out = sys.argv[1:4]
count = int(sys.argv[4]) if len(sys.argv) > 4 else 32
UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
url = f'https://www.artstation.com/api/v2/search/projects.json?query={urllib.parse.quote(q)}&page=1&per_page={count}&sorting=relevance'
d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json'}), timeout=30))
os.makedirs(out, exist_ok=True)
idx = []
for i, p in enumerate(d.get('data', [])):
    if p.get('is_adult_content'): continue
    sq = p['smaller_square_cover_url']
    tries = [sq.replace('/smaller_square/', '/large/'), sq.replace('/smaller_square/', '/medium/'), sq] if '/images/images/' in sq else [sq]
    f = os.path.join(out, f'{tag}_{i:02d}.jpg')
    got = None
    for u in tries:
        try:
            data = urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': UA}), timeout=30).read()
            open(f, 'wb').write(data); got = u; break
        except Exception:
            continue
    if not got: continue
    time.sleep(0.1)
    idx.append({'i': i, 'file': f, 'img': got, 'page': p['url'], 'title': p['title'], 'user': p['user']['full_name'], 'username': p['user']['username']})
json.dump(idx, open(os.path.join(out, f'{tag}_index.json'), 'w'), ensure_ascii=False, indent=1)
files = []
for it in idx: files += ['-label', str(it['i']), it['file']]
subprocess.run(['montage', '-pointsize', '14', '-fill', 'white', '-background', '#222'] + files +
               ['-geometry', '200x200+2+2', '-tile', '8x', os.path.join(out, f'{tag}_sheet.jpg')], check=True)
print(tag, len(idx), 'of', d.get('total_count'))
