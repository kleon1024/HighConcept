"""Search Wikimedia Commons for free-licensed images/videos and show licence + author. Usage: python3 media/commons.py "query" [n]"""
import json, sys, time, urllib.error, urllib.parse, urllib.request, re, html
UA = 'HighConceptVideo/1.0 (educational explainer videos; contact via github.com/kleon1024/HighConcept)'
def api(params):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({**params, 'format': 'json'})
    for k in range(5):                                    # Commons rate-limits bursts: back off and retry
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(5 * 2 ** k)
    raise RuntimeError('Commons kept rate-limiting')
def search(q, n=8, width=1600):
    d = api({'action': 'query', 'generator': 'search', 'gsrsearch': q, 'gsrnamespace': 6, 'gsrlimit': n,
             'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size|mime', 'iiurlwidth': width})
    out = []
    for p in (d.get('query', {}).get('pages', {}) or {}).values():
        ii = p['imageinfo'][0]; md = ii.get('extmetadata', {})
        g = lambda k: re.sub('<[^>]+>', '', html.unescape(md.get(k, {}).get('value', ''))).strip()
        out.append({'title': p['title'], 'mime': ii['mime'], 'w': ii.get('width'), 'h': ii.get('height'), 'url': ii['url'],
                    'thumb': ii.get('thumburl'), 'license': g('LicenseShortName'), 'artist': g('Artist')[:80], 'credit': g('Credit')[:80],
                    'desc': g('ImageDescription')[:140]})
    return out
if __name__ == '__main__':
    for r in search(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 8):
        print(f"{r['title']}\n   {r['mime']} {r['w']}x{r['h']} | {r['license']} | {r['artist']} | {r['desc']}")
