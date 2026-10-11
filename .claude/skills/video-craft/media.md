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
- **Video**: YouTube blocks this cloud environment's downloads (bot check); a user-supplied cookies file would be needed.
  Prefer CC footage from journal supplements or Commons; check quality (resolution, exposure) before planning around it.

Feedback log: 「对动画不太好表达的部分换成图片…按需增加」「有些地方应该贴照片的」.
