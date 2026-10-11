# Photo credits

Real photos are used sparingly, only where a drawing can't carry the point (a real place, a real sensor, a real cell, a real
retina, real people). Each one is credited on screen. `media/media.json` is the manifest; `python3 media/fetch_media.py`
re-downloads into `public/media` (Wikimedia asks for standard thumbnail sizes and rate-limits bursts, so the script backs off).
`media/commons.py "query"` searches Wikimedia Commons with licences shown.

| File | Used in | Author | Licence | Source |
|---|---|---|---|---|
| `public/media/icl_night.jpg` | IceCube intro | John Hardin | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:The_ICL_at_Night.jpg |
| `public/media/dom.jpg` | IceCube intro | Amble | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:ICECUBE_dom_taklampa.jpg |
| `public/media/halzen.jpg` | IceCube prize card | INFN | CC0 | https://commons.wikimedia.org/wiki/File:Francis_Halzen_(2025).jpg |
| `public/media/opto_lab.jpg` | optogenetics opening | Bd008 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Optogenetics_imetronic.JPG |
| `public/media/pond.jpg` | optogenetics pond | danxoneil (Flickr) | CC BY 2.0 | https://www.flickr.com/photos/danxoneil/4835834487 |
| `public/media/chlamy.jpg` | optogenetics pond | Dartmouth Electron Microscope Facility | Public domain | https://commons.wikimedia.org/wiki/File:Chlamydomonas6-1.jpg |
| `public/media/rp_fundus.jpg` | optogenetics sight | Christian Hamel | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Fundus_of_patient_with_retinitis_pigmentosa,_mid_stage.jpg |
| `public/media/deisseroth.jpg` | optogenetics prize | Christopher Michel | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Karl_Deisseroth_by_Christopher_Michel_04.jpg |
| `public/media/hegemann.jpg` | optogenetics prize | Millencolin | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Peter_Hegemann.jpg |
| `public/media/nagel.jpg` | optogenetics prize | Millencolin | CC0 | https://commons.wikimedia.org/wiki/File:Prof._Dr._Georg_Nagel.png |

YouTube downloads (yt-dlp) are blocked from this cloud environment by YouTube's bot check; footage would need a cookies file.
