# Photos & footage (图片 + 视频)

- **Only where drawing can't carry it**: real people (laureates, scientists), real places (the lab, the pole), real
  objects (the sensor, the rig), real biology/medicine (micrographs, fundus photos). Not as decoration.
- **Where they work best**: the opening (credibility), a scene's establishing shot that then zooms into animation, and
  people cards. One photo per scene at most.
- **Integrate**: grade into the film's palette (shade, duotone or colour wash), frame consistently (same radius, same
  border), and use the photo as a transition element (zoom into it, match its shapes).
- **Sources & licences**: Wikimedia Commons (`shape-of-sound/media/commons.py`), Openverse (`media/openverse.py`, CC images
  from Flickr and others), NASA (public domain), journal supplements (CC BY). Record each in `media/media.json`,
  fetch with `media/fetch_media.py` (standard thumbnail sizes, back-off on 429), credit on screen and in
  `media/MEDIA_CREDITS.md`. Never use unlicensed images, logos or likenesses of fictional characters.
- **Wikimedia 429s**: read the error page. 「does not comply with our robot policy」 means the User-Agent has no contact;
  use the UA in `media/commons.py`, never a bare one. 「Too many requests」 means slow down and request only standard
  thumbnail widths (1280, 1920, 3840; not originals). Space requests ~12 s apart and retry in a slow loop. Museums with
  open APIs are often faster sources for the same works: The Met (`collectionapi.metmuseum.org`, `/v1.1/search`; CC0
  images at `images.metmuseum.org/CRDImages/.../original/`) and Flickr originals of CC0 photos.
- **Crop to the picture**: prints and album leaves come with mounts and paper margins; crop to the image area before use
  (note the crop in `media.json`), and cut museum objects out of grey studio grounds (`media/chroma_cut.py`).
- **Video**: YouTube blocks this cloud environment's downloads (bot check); a user-supplied cookies file would be needed.
  Prefer CC footage from journal supplements or Commons; check quality (resolution, exposure) before planning around it.

Feedback log: 「对动画不太好表达的部分换成图片…按需增加」「有些地方应该贴照片的」.
