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
| `public/media/el_lecoq.jpg` | periodic table opening | Unknown (before 1912) | Public domain | https://commons.wikimedia.org/wiki/File:Lecoq_de_Boisbaudran.jpg |
| `public/media/el_mendeleev.jpg` | periodic table opening | Unknown (1897) | Public domain | https://commons.wikimedia.org/wiki/File:DIMendeleevCab.jpg |
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
| `public/media/me_athens.jpg` | 意义，从哪来？ (柏拉图) | Raphael (1509–1511) | Public domain | https://commons.wikimedia.org/wiki/File:"The_School_of_Athens"_by_Raffaello_Sanzio_da_Urbino.jpg |
| `public/media/me_diogenes.jpg` | 意义，从哪来？ (犬儒) | Jean-Léon Gérôme (1860), Walters Art Museum | Public domain | https://commons.wikimedia.org/wiki/File:Jean-Léon_Gérôme_-_Diogenes_-_Walters_37131.jpg |
| `public/media/me_marcus.jpg` | 意义，从哪来？ (斯多葛) | Wilfredor (photo) | CC0 | https://commons.wikimedia.org/wiki/File:Ancient_statue_of_emperor_Marcus_Aurelius.jpg |
| `public/media/me_rose.jpg` | 意义，从哪来？ (中世纪) | Eusebius (photo) | Public domain | https://commons.wikimedia.org/wiki/File:Chartres_-_cathédrale_-_rosace_nord.jpg |
| `public/media/me_vitruvian.jpg` | 意义，从哪来？ (文艺复兴) | Leonardo da Vinci (c. 1490); photo Luc Viatour | Public domain | https://commons.wikimedia.org/wiki/File:Da_Vinci_Vitruve_Luc_Viatour.jpg |
| `public/media/me_descartes.jpg` | 意义，从哪来？ (笛卡尔) | after Frans Hals | Public domain | https://commons.wikimedia.org/wiki/File:Frans_Hals_-_Portret_van_René_Descartes.jpg |
| `public/media/me_kant.jpg` | 意义，从哪来？ (康德) | Johann Gottlieb Becker (1768) | Public domain | https://commons.wikimedia.org/wiki/File:Immanuel_Kant_-_Gemaelde_1.jpg |
| `public/media/me_bentham.jpg` | 意义，从哪来？ (边沁) | Henry William Pickersgill (1829) | Public domain | https://commons.wikimedia.org/wiki/File:Jeremy_Bentham_by_Henry_William_Pickersgill.jpg |
| `public/media/me_wanderer.jpg` | 意义，从哪来？ (叔本华) | Caspar David Friedrich (1818) | Public domain | https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg |
| `public/media/me_schop.jpg` | 意义，从哪来？ (叔本华) | Johann Schäfer (1859) | Public domain | https://commons.wikimedia.org/wiki/File:Arthur_Schopenhauer_by_J_Schäfer,_1859b.jpg |
| `public/media/me_wedge.jpg` | 意义，从哪来？ (马克思) | El Lissitzky (1919) | Public domain | https://commons.wikimedia.org/wiki/File:Beat_the_Whites_with_the_Red_Wedge.jpg |
| `public/media/me_marx.jpg` | 意义，从哪来？ (马克思) | John Jabez Edwin Mayall (1875) | Public domain | https://commons.wikimedia.org/wiki/File:Karl_Marx_001.jpg |
| `public/media/me_scream.jpg` | 意义，从哪来？ (尼采) | Edvard Munch (1893), National Gallery of Norway | Public domain | https://commons.wikimedia.org/wiki/File:Edvard_Munch,_1893,_The_Scream,_oil,_tempera_and_pastel_on_cardboard,_91_x_73_cm,_National_Gallery_of_Norway.jpg |
| `public/media/me_nietzsche.jpg` | 意义，从哪来？ (尼采) | Gustav-Adolf Schultze (1882) | Public domain | https://commons.wikimedia.org/wiki/File:Nietzsche1882.jpg |
| `public/media/me_panopticon.jpg` | 意义，从哪来？ (福柯) | Willey Reveley (c. 1791) | Public domain | https://commons.wikimedia.org/wiki/File:Reveley_Plan_of_Houses_of_Inspection_c._1791.png |
| `public/media/nh_monk.jpg` | NIHIL · 虚无 (the abyss) | Caspar David Friedrich (1808–1810), Alte Nationalgalerie | Public domain | https://commons.wikimedia.org/wiki/File:Caspar_David_Friedrich_-_Der_Mönch_am_Meer_-_Google_Art_Project.jpg |
| `public/media/bd_shakyamuni.jpg` | 佛 · 第二支箭 (title) | Liang Kai 梁楷, *Shakyamuni Emerging from the Mountains* 出山释迦图 (13th c.), Tokyo National Museum | Public domain | https://commons.wikimedia.org/wiki/File:Liang_Kai-Shakyamuni_Emerging_from_the_Mountains.jpg |
| `public/media/bd_wheel.jpg` | 佛 · 第二支箭 (三毒) | Tibetan thangka, *Yama holding the Wheel of Life*, Wellcome Collection | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Yama,_the_Lord_of_Death,_holding_the_Wheel_of_Life_Wellcome_V0017709.jpg |
| `public/media/bd_jingang.jpg` | 佛 · 第二支箭 (金刚经) | *Diamond Sutra*, Dunhuang Cave 17, dated 868, British Library Or.8210/P.2 | Public domain | https://commons.wikimedia.org/wiki/File:Dunhuang_Diamond_Sutra.jpg |
| `public/media/bd_sengai.jpg` | 佛 · 第二支箭 (相) | Sengai Gibon 仙厓义梵, *○△□* (before 1819), Idemitsu Museum of Arts | Public domain | https://commons.wikimedia.org/wiki/File:Sengai_3.jpg |
| `public/media/bd_ox8.jpg` | 佛 · 第二支箭 (十牛图) | attributed to Tenshō Shūbun 天章周文, *Ten Oxherding Pictures* no. 8 (15th c.), Shōkoku-ji | Public domain | https://commons.wikimedia.org/wiki/File:Oxherding_pictures,_No._8.jpg |
| `public/media/bd_huineng.jpg` | 佛 · 第二支箭 (慧能) | Liang Kai 梁楷, *The Sixth Patriarch Chopping Bamboo* 六祖斫竹图 (13th c.), Tokyo National Museum | Public domain | https://commons.wikimedia.org/wiki/File:Huineng_Cut_Bamboo.jpg |
| `public/media/lv_rose.jpg` (and the derived `lv_rose_cut.png`, `lv_field.jpg`) | 什么是爱 (玫瑰, 五千朵玫瑰) | Pierre-Joseph Redouté, *Rosa centifolia foliacea*, Les Roses (1817–1824) | Public domain | https://commons.wikimedia.org/wiki/File:Redoute_-_Rosa_centifolia_foliacea.jpg |
| `public/media/lv_foxes.jpg` | 什么是爱 (狐狸) | Franz Marc, *The Foxes* (1913), Kunstpalast Düsseldorf | Public domain | https://commons.wikimedia.org/wiki/File:Franz_Marc_-_The_Foxes_-_Google_Art_Project.jpg |
| `public/media/lv_wheat.jpg` | 什么是爱 (麦子) | Vincent van Gogh, *Wheat Field with Cypresses* (1889), Metropolitan Museum of Art | CC0 | https://commons.wikimedia.org/wiki/File:Wheat_Field_with_Cypresses_MET_DT1567.jpg |
| `public/media/lv_geese.jpg` | 什么是爱 (雁丘) | Utagawa Hiroshige, *Geese flying past the full moon*, San Diego Museum of Art | Public domain | https://commons.wikimedia.org/wiki/File:Geese_flying_past_the_full_moon_(5759417842).jpg |
| `public/media/lv_romeo.jpg` | 什么是爱 (罗密欧与朱丽叶) | Frank Dicksee, *Romeo and Juliet* (1884), Southampton City Art Gallery | Public domain | https://commons.wikimedia.org/wiki/File:Frank_Bernard_Dicksee_-_Romeo_and_Juliet,_1884.jpg |
| `public/media/lv_kiss.jpg` | 什么是爱 (吻) | Gustav Klimt, *The Kiss* (1907–08), Belvedere, Vienna | Public domain | https://commons.wikimedia.org/wiki/File:The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg |
| `public/media/lv_bride.jpg` | 什么是爱 (两个孤独) | Rembrandt, *The Jewish Bride* (c. 1665–69), Rijksmuseum | Public domain | https://commons.wikimedia.org/wiki/File:Rembrandt_Harmensz._van_Rijn_-_Portret_van_een_paar_als_oudtestamentische_figuren,_genaamd_%27Het_Joodse_bruidje%27_-_Google_Art_Project.jpg |
| `public/media/lv_loquat.jpg` | 什么是爱 (枇杷树) | Lin Chun 林椿, *Loquats and Mountain Bird* 枇杷山鸟图 (Southern Song), Palace Museum | Public domain | https://commons.wikimedia.org/wiki/File:Loquats_and_Mountain_Bird.jpg |
