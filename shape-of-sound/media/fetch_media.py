"""Download the photos/footage listed in media/media.json into public/media (resized for 1080×1920). Credits: media/MEDIA_CREDITS.md"""
import hashlib, json, os, subprocess, sys, time, urllib.error, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from commons import UA
HERE = os.path.dirname(os.path.abspath(__file__)); OUT = os.path.join(HERE, '..', 'public', 'media')
def commons_url(title, orig_w, width=1280):
    """Direct upload.wikimedia.org URL (no API call) at a standard thumbnail width."""
    name = title.split(':', 1)[1].replace(' ', '_'); h = hashlib.md5(name.encode()).hexdigest(); q = urllib.parse.quote(name)
    # Wikimedia asks for its standard thumbnail widths: take the largest one that fits the original and the request
    std = [w for w in (3840, 1920, 1280, 960, 500, 330, 250, 120) if w <= min(width, orig_w)]
    if not std: return f'https://upload.wikimedia.org/wikipedia/commons/{h[0]}/{h[:2]}/{q}'
    return f'https://upload.wikimedia.org/wikipedia/commons/thumb/{h[0]}/{h[:2]}/{q}/{std[0]}px-{q}'
def main():
    items = json.load(open(os.path.join(HERE, 'media.json'), encoding='utf-8'))
    os.makedirs(OUT, exist_ok=True)
    for it in sorted(items, key=lambda i: i['file'].endswith('.mp4')):   # photos first, footage last
        dst = os.path.join(OUT, it['file'])
        if os.path.exists(dst): continue
        src = it.get('direct') or commons_url(it['commons'], it.get('orig_w', 0), it.get('thumb_w', 1280))
        tmp = dst + '.src'
        for k in range(6):                                  # back off politely when the image servers rate-limit
            try:
                open(tmp, 'wb').write(urllib.request.urlopen(urllib.request.Request(src, headers={'User-Agent': UA}), timeout=60).read()); break
            except urllib.error.HTTPError as e:
                if e.code != 429 or k == 5: raise
                time.sleep(20 * 2 ** k)
        time.sleep(3)
        if it['file'].endswith('.mp4'):   # footage: h264, no audio, at most 1080 wide
            subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', tmp, '-an', '-vf', 'scale=min(1080\\,iw):-2', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', dst], check=True)
        else:                             # photos: jpeg, long edge 2000
            subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-i', tmp, '-vf', "scale='if(gt(iw,ih),min(2000,iw),-2)':'if(gt(iw,ih),-2,min(2000,ih))'", '-q:v', '3', dst], check=True)
        os.remove(tmp)
        print('got', it['file'], '|', it['license'])
main()
