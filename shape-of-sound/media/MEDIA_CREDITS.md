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
| `public/media/ad_lastsupper.jpg` | art date: Renaissance (perspective demo) | Leonardo da Vinci, *The Last Supper* (1495–98) | Public domain | https://commons.wikimedia.org/wiki/File:Leonardo_da_Vinci_-_The_Last_Supper_high_res.jpg |
| `public/media/ad_caravaggio.jpg` | art date: Baroque | Caravaggio, *The Calling of Saint Matthew* (1599–1600) | Public domain (PD-Art) | https://commons.wikimedia.org/wiki/File:Caravaggio_-_La_vocazione_di_San_Matteo.jpg |
| `public/media/ad_monet.jpg` | art date: Impressionism | Claude Monet, *Impression, Sunrise* (1872) | Public domain | https://commons.wikimedia.org/wiki/File:Monet_-_Impression,_Sunrise.jpg |
| `public/media/ad_starrynight.jpg` | art date: Post-Impressionism | Vincent van Gogh, *The Starry Night* (1889) | Public domain | https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg |
| `public/media/ad_matisse.jpg` | art date: Fauvism | Henri Matisse, *Portrait of Madame Matisse. The Green Line* (1905), Statens Museum for Kunst | Public Domain Mark 1.0 (SMK Open) | https://open.smk.dk/artwork/image/KMSr171 |
| `public/media/ad_gris.jpg` | art date: Cubism | Juan Gris, *Portrait of Pablo Picasso* (1912), Art Institute of Chicago | Public domain | https://commons.wikimedia.org/wiki/File:Juan_Gris_-_Portrait_of_Pablo_Picasso_-_Google_Art_Project.jpg |
| `public/media/ad_blacksquare.jpg` | art date: hook, Abstraction, ending | Kazimir Malevich, *Black Square* (1915), Tretyakov Gallery | Public domain | https://commons.wikimedia.org/wiki/File:Kazimir_Malevich,_1915,_Black_Suprematic_Square,_oil_on_linen_canvas,_79.5_x_79.5_cm,_Tretyakov_Gallery,_Moscow.jpg |
| `public/media/ad_mucha.jpg` | art date: Art Nouveau | Alphonse Mucha, *Rêverie* (1897), decorative panel for F. Champenois | Public domain | https://commons.wikimedia.org/wiki/File:Alfons_Mucha_-_F._Champenois_Imprimeur-%C3%89diteur.jpg |

The art-date film (`src/artdate/`) also shows original pastiches drawn in code and labelled 「风格示意」 on screen (a urinal
signed "R. MUTT 1917" for Dada, a colour-field canvas, a Ben-Day comic panel, an Art Deco and a Bauhaus poster), so no
copyrighted work (Duchamp's *Fountain* photo, Picasso/Braque, Rothko/Pollock, Warhol/Lichtenstein) is reproduced.
Sound effects for that film are from Mixkit (free licence, see `music/SFX_LIBRARY.md`) or synthesised in `music/artdate.py`.

YouTube downloads (yt-dlp) are blocked from this cloud environment by YouTube's bot check; footage would need a cookies file.
