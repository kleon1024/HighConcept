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
| `public/media/oc_wave.jpg` | 洋流 (开场) | Katsushika Hokusai 葛饰北斋, *Under the Wave off Kanagawa* 神奈川沖浪裏 (c. 1830–32), Metropolitan Museum of Art (JP1847) | CC0 | https://commons.wikimedia.org/wiki/File:「富嶽三十六景_神奈川沖浪裏」-Under_the_Wave_off_Kanagawa_(Kanagawa_oki_nami_ura),_or_The_Great_Wave,_from_the_series_Thirty-six_Views_of_Mount_Fuji_(Fugaku_sanjūrokkei)_MET_DP141042.jpg |
| `public/media/oc_po_gulf.mp4`, `oc_po_kuro.mp4`, `oc_po_acc.mp4` (cut by `media/nasa_clips.sh`) | 洋流 (标题, 黑潮, 南极绕极流) | NASA/Goddard Space Flight Center Scientific Visualization Studio, *Perpetual Ocean* (2011), ECCO2 model data (MIT/JPL) | Public domain (NASA) | https://svs.gsfc.nasa.gov/3827 |
| `public/media/oc_franklin.jpg` | 洋流 (富兰克林的河) | Benjamin Franklin & Timothy Folger, *A Chart of the Gulf Stream*, engraved by James Poupard (1786), Library of Congress | Public domain | https://commons.wikimedia.org/wiki/File:Franklingulfstream.jpg |
| `public/media/oc_homer.jpg` | 洋流 (这条河有多大) | Winslow Homer, *The Gulf Stream* (1899), Metropolitan Museum of Art | Public domain | https://commons.wikimedia.org/wiki/File:Winslow_Homer_-_The_Gulf_Stream_-_Metropolitan_Museum_of_Art.jpg |
| `public/media/oc_jelly.jpg` (and the cut-out `oc_jelly_cut.png`, made with `media/cutout.py`) | 洋流 (深海) | Ernst Haeckel, *Kunstformen der Natur* (1904), plate 8, Discomedusae | Public domain | https://commons.wikimedia.org/wiki/File:Haeckel_Discomedusae_8.jpg |
| `public/media/oc_radio.jpg` (and the cut-out `oc_radio_cut.png`) | 洋流 (深海) | Ernst Haeckel, *Kunstformen der Natur* (1904), plate 71, Stephoidea | Public domain | https://commons.wikimedia.org/wiki/File:Haeckel_Stephoidea.jpg |
| `public/media/oc_challenger.jpg` | 洋流 (大海的记忆) | *HMS Challenger*, The Illustrated London News, 14 December 1872 | Public domain | https://commons.wikimedia.org/wiki/File:HMS_Challenger_(1858).jpg |
| `public/media/oc_river.jpg` | 洋流 (李白) | Ma Yuan 马远, *Water Album* 水图: 黄河逆流 (Southern Song), Palace Museum, Beijing | Public domain | https://commons.wikimedia.org/wiki/File:Ma_Yuan_-_Water_Album_-_The_Yellow_River_Breaches_its_Course.jpg |
| `public/media/oc_clouds.jpg` | 洋流 (回家) | Ma Yuan 马远, *Water Album* 水图: 云生苍海 (Southern Song), Palace Museum, Beijing | Public domain | https://commons.wikimedia.org/wiki/File:Ma_Yuan_-_Water_Album_-_Clouds_Rising_from_the_Green_Sea.jpg |
| `src/ocean/land.json` (made by `src/ocean/make_land.py`) | 洋流 (all maps) | Natural Earth, 1:50m land polygons | Public domain | https://www.naturalearthdata.com/ |
| `public/media/dao_fisher.jpg` | 道 · 空 (留白, 结尾) | attributed to Ma Yuan 传马远, *Angler on a Wintry Lake* 寒江独钓图 (Southern Song), Tokyo National Museum TA-140 | Public domain | https://commons.wikimedia.org/wiki/File:Angler_on_a_Wintry_Lake,_by_Ma_Yuan,_1195.jpg |
| `public/media/dao_ox.jpg` (one ox, cropped from a 3840-px copy) | 道 · 空 (庖丁解牛) | Han Huang 韩滉, *Five Oxen* 五牛图 (Tang), Palace Museum, Beijing | Public domain | https://commons.wikimedia.org/wiki/File:Хань_Хуан._Пять_быков._Гугун,_Пекин.1.jpg |
| `public/media/dao_tree.jpg` (the old trees, cropped from a 3840-px copy) | 道 · 空 (无用之用) | Guo Xi 郭熙, *Old Trees, Level Distance* 树色平远图 (c. 1080), Metropolitan Museum of Art 1981.276 | CC0 | https://commons.wikimedia.org/wiki/File:北宋_郭熙_樹色平遠圖_卷_-Old_Trees,_Level_Distance_MET_DP167811.jpg |
| `public/media/dao_fly.jpg` | 道 · 空 (庄周梦蝶) | Lu Zhi 陆治, *Zhuangzi Dreaming of a Butterfly* 梦蝶图 (Ming, 16th c.) | Public domain | https://commons.wikimedia.org/wiki/File:Dschuang-Dsi-Schmetterlingstraum-Zhuangzi-Butterfly-Dream.jpg |
| `public/media/dao_paper.jpg` (made by `src/dao/make_paper.py`), `ru_rubbing.jpg` (made by `src/ru/make_rubbing.py`) | 道, 儒 (grounds) | generated | — | — |
| `public/media/hw_turnip.jpg` | 万圣节 · 开场 | Culture Vannin (Isle of Man), Hop-tu-Naa turnip lantern, 2019 | CC0 | https://commons.wikimedia.org/wiki/File:Hop_tu_Naa_turnip_and_child.jpg |
| `public/media/hw_snap.png` | 万圣节 · 1833年的万圣夜 | Daniel Maclise, Snap-Apple Night (1833), private collection | Public domain | https://commons.wikimedia.org/wiki/File:Snap-Apple_Night_globalphilosophy.PNG |
| `public/media/hw_witch.jpg` | 万圣节 · 明信片 | Raphael Tuck & Sons, Hallowe'en postcard (c. 1908), Missouri History Museum | Public domain | https://commons.wikimedia.org/wiki/File:"Hallowe'en."_(A_Witch_riding_a_broomstick_with_a_black_cat).jpg |
| `public/media/hw_cats.jpg` | 万圣节 · 明信片 | A Thrilling Hallowe'en, postcard (c. 1910), Missouri History Museum | Public domain | https://commons.wikimedia.org/wiki/File:"A_Thrilling_Hallowe'en."_(Three_black_cats_flying_through_the_air_with_Jack-o-lanterns).jpg |
| `public/media/hw_boys.jpg` | 万圣节 · 明信片 | Halloween Greetings, postcard (c. 1910), Missouri History Museum | Public domain | https://commons.wikimedia.org/wiki/File:"Halloween_Greetings."_(Two_boys_carrying_a_large_Jack-O-Lantern).jpg |
| `public/media/hw_pulled.jpg` | 万圣节 · 明信片 | Hallowe'en, postcard (c. 1910), Missouri History Museum | Public domain | https://commons.wikimedia.org/wiki/File:"Hallowe'en."_(A_Witch_riding_a_broomstick_being_pulled_by_a_jack-o-lantern_with_a_black_cat).jpg |
| `public/media/hw_oiwa.jpg` (cropped to the print (colour bars removed)) | 万圣节 · お盆 | 葛饰北斋《百物語 · お岩さん》(c. 1831–32), Library of Congress | Public domain | https://commons.wikimedia.org/wiki/File:Oiwa_LCCN2005678554.jpg |
| `public/media/hw_laugh.jpg` (cropped to the print (colour bars removed)) | 万圣节 · 扮鬼 | 葛饰北斋《百物語 · 笑ひはんにや》(c. 1831–32), Library of Congress | Public domain | https://commons.wikimedia.org/wiki/File:The_laughing_demon_LCCN2005678553.jpg |
| `public/media/hw_catrina.jpg` (cropped to the print on the page) | 万圣节 · 亡灵节 | José Guadalupe Posada, La Calavera Catrina (plate c. 1910–13; printed 1943), The Met | CC0 | https://commons.wikimedia.org/wiki/File:Page_15-_Catrina_(calavera),_from_'36_Grabados'_(Mexico,_1943)_MET_DP872837.jpg |
| `public/media/hw_ofrenda.jpg` | 万圣节 · 亡灵节 | Aletsssss, a home ofrenda (2024) | CC0 | https://commons.wikimedia.org/wiki/File:Ofrenda_dia_de_muertos.jpg |
| `public/media/hw_hedeng.jpg` (cropped to the photograph (captions removed)) | 万圣节 · 中元 | 小谷文一《臺灣寫真帖》(1915): 中元节水灯 | Public domain | https://commons.wikimedia.org/wiki/File:Chinese_tradition_of_Floating_lanterns_in_Taiwan.jpg |
| `public/media/hw_boats.jpg` (picture area cropped from the 1920-px thumbnail (paper margins removed)) | 万圣节 · お盆 | after J. M. van Lynden, La fête des lampes, les morts s'en vont (1862), Rijksmuseum | CC0 | https://commons.wikimedia.org/wiki/File:Gezicht_op_een_baai_in_Japan_met_daarin_brandende_en_met_lampions_verlichte_schepen,_RP-P-2018-1128.jpg |
| `public/media/hw_daimonji.jpg` | 万圣节 · お盆 | Takeshi Kuboki, 五山送り火 · 大文字 (2009) | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:Daimonji_on_Gozan_okuribi_(3825647129).jpg |
| `public/media/ru_kongzi.jpg` | 儒 · 结尾 | 传马远《孔子像》(南宋), 故宫博物院 | Public domain | https://commons.wikimedia.org/wiki/File:Ma_Yuan-Confucius.png |
| `public/media/ru_stele.jpg` (the rubbing only (crumpled paper at right removed)) | 儒 · 周游列国 | 吴道子（款）《先师孔子行教像》碑, 曲阜 (photo from 亜細亜大観, 1920s–30s) | Public domain | https://commons.wikimedia.org/wiki/File:亜細亜大観_06_070_"吳道子孔子像_（曲阜）".jpg |
| `public/media/ru_xiaojing.jpg` (painting area cropped from the 1920-px thumbnail (mount removed)) | 儒 · 学生问仁 | 《孝经图 · 开宗明义章》(南宋, 传马和之画), 台北故宫博物院 | Public domain | https://commons.wikimedia.org/wiki/File:The_Classic_of_Filial_Piety_(開宗明義章_畫).jpg |
| `public/media/ru_family.jpg` | 儒 · 齐家 | 传李公麟《孝经图》卷 (北宋, c. 1085), section 「纪孝行章」, The Met 1996.479a–c | CC0 | https://www.metmuseum.org/art/collection/search/39895 |
| `public/media/ru_gui.png` (cut out with media/chroma_cut.py) | 儒 · 齐家 | 西周 青铜簋 (late 11th–early 10th c. BCE), The Met | CC0 | https://www.metmuseum.org/art/collection/search/49385 |
| `public/media/ru_bells.jpg` (top of the 2048-px Flickr copy (the upper bells between the rack's two beams)) | 儒 · 四海之内 | 曾侯乙编钟 (战国, 433 BCE or later), Hubei Provincial Museum; photo Gary Todd | CC0 | https://commons.wikimedia.org/wiki/File:Two_Tone_Set-bells_of_Marquis_Yi_of_Zeng_(10166252544).jpg |
| `public/media/hlm_daiyu.jpg` | 红楼 · 开场 / 判词 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 林黛玉 | Public domain | https://commons.wikimedia.org/wiki/File:Lin_Daiyu_Hongloumeng_Tuyong.jpg |
| `public/media/hlm_baochai.jpg` | 红楼 · 判词 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 薛宝钗 | Public domain | https://commons.wikimedia.org/wiki/File:Hongloumeng_Tuyong_Xue_Baochai.jpg |
| `public/media/hlm_baoyu.jpg` | 红楼 · 太虚幻境 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 贾宝玉 | Public domain | https://commons.wikimedia.org/wiki/File:Jia_Baoyu_Hongloumeng_Tuyong.jpg |
| `public/media/hlm_stone.jpg` | 红楼 · 第一页 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 通灵宝石、绛珠仙草 | Public domain | https://commons.wikimedia.org/wiki/File:红楼梦图咏-通灵宝石、绛珠仙草.jpg |
| `public/media/hlm_yuanchun.jpg` | 红楼 · 原应叹息 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 贾元春 | Public domain | https://commons.wikimedia.org/wiki/File:Hongloumeng_Tuyong_Jia_Yuanchun.jpg |
| `public/media/hlm_yingchun.jpg` | 红楼 · 原应叹息 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 贾迎春 | Public domain | https://commons.wikimedia.org/wiki/File:Hongloumeng_Tuyong_Jia_Yingchun.jpg |
| `public/media/hlm_tanchun.jpg` | 红楼 · 原应叹息 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 贾探春 | Public domain | https://commons.wikimedia.org/wiki/File:Hongloumeng_Tuyong_Jia_Tanchun.jpg |
| `public/media/hlm_xichun.jpg` | 红楼 · 原应叹息 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 贾惜春 | Public domain | https://commons.wikimedia.org/wiki/File:Hongloumeng_Tuyong_Jia_Xichun.jpg |
| `public/media/hlm_xifeng.jpg` | 红楼 · 好了歌 | 改琦《红楼梦图咏》(woodblock, 1879 ed.), scan from 東京藝術大学 · 王熙凤 | Public domain | https://commons.wikimedia.org/wiki/File:Hongloumeng_Tuyong_Wang_Xifeng.jpg |
| `public/media/hlm_zanghua.jpg` | 红楼 · 葬花 | 费丹旭「金陵十二钗：林黛玉葬花」(before 1850), from 《中國歷代仕女畫集》 | Public domain | https://commons.wikimedia.org/wiki/File:Lin_Daiyu_Burying_Flowers.png |
| `public/media/hlm_garden.jpg` | 红楼 · 大观园 | 孙温《全本红楼梦图》大观园 (late Qing), 旅顺博物馆 | Public domain | https://commons.wikimedia.org/wiki/File:Sun_Wen_Red_Chamber_Daguanyuan.jpg |
