"""Search Openverse (CC-licensed images from Flickr, Wikimedia and others). Usage: python3 media/openverse.py "query" [n]"""
import json, sys, urllib.parse, urllib.request
def search(q, n=12):
    url = 'https://api.openverse.org/v1/images/?' + urllib.parse.urlencode({'q': q, 'license_type': 'commercial,modification', 'page_size': n})
    d = json.load(urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'HighConceptVideo/1.0 (educational explainer videos)'}), timeout=30))
    return d.get('results', [])
if __name__ == '__main__':
    for r in search(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 12):
        print(f"{r['id']} | {(r.get('title') or '')[:46]} | {r.get('license')} {r.get('license_version')} | {(r.get('creator') or '')[:24]} | {r.get('source')} | {r.get('width')}x{r.get('height')}\n    {r.get('url')}")
