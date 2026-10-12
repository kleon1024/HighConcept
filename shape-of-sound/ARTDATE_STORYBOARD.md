# 看不懂也能装：美术馆约会腔调指南 — storyboard

Landscape 4:3 · 1440×1080 · 30 fps · **73 s** (36½ bars at 120 BPM, 2-s bars) · Remotion composition `ArtDate`
Timing, text and camera live in `src/artdate/artdate.json`; the score (`music/artdate.py`) reads the same file.

**One-sentence story**: on a museum date he panics in front of a black square — a pocket guide walks him through
four halls (and five centuries of architecture), he blunders at every 踩雷, and at the end he answers the same
question smoothly, shuts down "这我也能画" with "但你没有", and they clink glasses.

- **有用**: a 4-part kit per hall — 一秒认出 / 装逼台词 / 进阶动作 / 踩雷 — with real, checkable facts.
- **有趣**: his blunders, her side-eye, the running stamp 「又一个被骂出来的名字」 (№1 → №5), the X-ray callback.
- **新奇**: the couple and the gallery itself repaint into each movement's style; the building rebuilds from a
  Gothic nave to a Bauhaus curtain wall while they walk; the closing zoom-out shows the museum in cross-section.

## Format & grid
- Safe margin 70 px on all sides. Left ~⅔: the painting on the wall + the couple seen from behind (Rückenfigur).
  Right column (x 912–1370): the kit card (one card per beat, landing on a stack). Top-left: hall title + architecture tag.
  Bottom-left: the credit line for the real work on screen.
- Camera: a pinhole camera facing the long gallery wall (`world.ts`), trucking along it; halls are laid out left→right
  (古典 x≈−60…−30, 印象派 −30…0, 现代 0…30, 设计 30…56); the black square hangs at x=10 (hook, mid-film, ending).

## Cast (original drawings, never real likenesses)
- **他** (the protagonist, left): camel overcoat, mustard-and-navy scarf, dark hair. Seen from behind; turns to profile.
- **她** (the date, right): burgundy dress, low chestnut ponytail, small gold earrings. Asks the question, reacts.
- **路人**: a blurred foreground silhouette who says 「这我也能画。」 at the end.

## Movements, kit lines and real works (13 movements + architecture)

| Hall | Movement (一秒认出) | Work on the wall | Licence |
|---|---|---|---|
| 古典馆 | 文艺复兴 Renaissance 约1400–1600 · 「透视 · 对称 · 柔光」 | 达·芬奇《最后的晚餐》1495–98 | PD, Commons |
| 古典馆 | 巴洛克 Baroque 约1600–1750 · 「黑底 · 追光 · 戏剧感」 | 卡拉瓦乔《圣马太蒙召》1599–1600 | PD-Art, Commons |
| 印象派馆 | 印象派 Impressionism 1874–1886 · 「碎笔触 · 户外光」 | 莫奈《印象·日出》1872 | PD, Commons |
| 印象派馆 | 后印象派 Post-Impressionism 1886–1905 · 「修拉点点，梵高转圈」 | 梵高《星月夜》1889 | PD, Commons |
| 现代与抽象馆 | 野兽派 Fauvism 1905 · 「脸可以是绿的」 | 马蒂斯《马蒂斯夫人像（绿线）》1905 | Public Domain Mark, SMK Open |
| 现代与抽象馆 | 立体派 Cubism 1908 · 「一张脸，几个角度」 | 胡安·格里斯《毕加索肖像》1912 | PD, Commons |
| 现代与抽象馆 | 抽象 Abstraction 1915 · 「只剩形状和颜色」 | 马列维奇《黑方块》1915 | PD, Commons |
| 现代与抽象馆 | 达达 Dada 1916 · 「小便池也算艺术」 | own drawing of a urinal signed "R. MUTT 1917" (示意图) | original |
| 现代与抽象馆 | 抽象表现主义 (进阶动作 beat) | own colour-field canvas (风格示意) | original |
| 现代与抽象馆 | 波普 Pop Art 1950s–60s · 「网点 · 漫画 · 广告」 | own Ben-Day comic panel (风格示意) | original |
| 设计馆 | 新艺术运动 Art Nouveau 1890–1910 · 「藤蔓曲线 · 长发女神」 | 穆夏 F. Champenois 海报 1897 | PD, Commons |
| 设计馆 | 装饰艺术 Art Deco 1920s–30s · 「几何 · 对称 · 金色放射」 | own Deco poster (风格示意) | original |
| 设计馆 | 包豪斯 Bauhaus 1919–1933 · 「方圆三角 · 三原色」 | own Bauhaus poster (风格示意) | original |

Picasso/Braque, Dalí/Magritte, Pollock/Rothko, Warhol/Lichtenstein and Breuer chairs are **not** shown; copyrighted
movements get original pastiches labelled 「风格示意」, and the Stieglitz photo of *Fountain* is not used.

### The kit, hall by hall (every line on screen)

**Hook** — her: 「你觉得这幅画 / 在表达什么？」 · him: 「呃……」 · freeze: 「（大脑一片空白）」 ·
guide card: 「看不懂也能装 · 美术馆约会腔调指南」 / 「别慌。」 / 「教你在美术馆里， / 装得比导览还专业。」

**古典馆** (tag 「建筑：哥特 → 巴洛克宫殿长廊」)
- stamp №1 on the Gothic arch: 「被骂出来的名字」 · 「"哥特"＝蛮族的风格」
- 一秒认出: 文艺复兴 · 「透视 · 对称 · 柔光」 / 巴洛克 · 「黑底 · 追光 · 戏剧感」 + stamp №2 「又一个被骂出来的名字」 · 「Barroco：一说原意"歪珍珠"」
- 进阶动作: 「顺着透视线，找消失点」 (lines draw themselves to Christ's right temple)
- 装逼台词: 「"消失点那儿，至今留着一个钉孔。"」 · note 「达·芬奇在此钉钉、拉线定透视」
- 踩雷: him 「哇，跟照片一样！」 → card 「那时候，还没有照片。」

**印象派馆** (tag 「建筑：火车站大厅 · 奥赛博物馆原是火车站（1900）」)
- 一秒认出: 印象派 · 「碎笔触 · 户外光」 / 后印象派 · 「修拉点点，梵高转圈」
- 装逼台词: 「"'印象派'这名字，本来是评论家骂人的。"」 · note 「勒鲁瓦，《喧哗》报，1874」 + stamp №3
- 进阶动作: 「后退三步，眯眼看」 (the frame narrows like eyelids and the dabs fuse — optical mixing)
- 踩雷: him 「马奈的睡莲真美！」 → card 「莫奈 ≠ 马奈」 (the O flips to A: MONET → MANET)

**现代与抽象馆** (tag 「建筑：白盒子展厅」) — quick-fire, one 1.5-s card per movement
- 野兽派 「脸可以是绿的」 + stamp №4 「评论家沃克塞勒："野兽"」 · 立体派 「一张脸，几个角度」 + stamp №5 「还是沃克塞勒："立方体"」
- 抽象 「只剩形状和颜色」 + 「开头那幅！」 → 装逼台词 「"它底下，还藏着两幅画。"」 · note 「2015 年特列季亚科夫画廊 X 光检测」
- 达达 「小便池也算艺术」 (collage letters) · 进阶动作 (抽象表现主义) 「站近一点，让颜色包住你」 · 波普 「网点 · 漫画 · 广告」
- 踩雷: him 「这我也能画。」 → card 「这句，千万别说。」 (planted for the ending)

**设计馆** (tag 「建筑：包豪斯玻璃幕墙（德绍，1926）」)
- 一秒认出: 新艺术运动 / 装饰艺术 / 包豪斯
- 装逼台词: 「"'形式追随功能'？那是沙利文 1896 年说的。"」 · note 「美国建筑师路易斯·沙利文」
- 进阶动作: 「找网格：一切都对齐」
- 踩雷: him 「好"性冷淡风"啊。」 → card 「包豪斯可是三原色。」
- architecture pair (the only architecture 装逼 line): wall text 「少即是多。—— 密斯」 → slapped over by
  「少即是无聊。—— 文丘里，1966」 as the building turns inside-out (colour-coded pipes, high-tech).

**Ending** — her: 「所以…… / 它在表达什么？」 · him (calm, steps closer): 「它底下， / 还藏着两幅画。」 · her: 「哇。」 ·
passer-by: 「这我也能画。」 · him: 「但你没有。」 · clink: 「Cheers.」 ·
final line: 「看不懂也没关系， / 艺术本来就是拿来聊的。」 · credits.

## Facts and sources (checked 2026-10-12)

| Claim on screen | Source / note |
|---|---|
| "Gothic" began as a Renaissance put-down: Vasari blamed the "barbarous German style" on the Goths | Wikipedia "Gothic architecture"; British Art Studies, *Imagining Invention* (notes Filarete's "gente barbara"; exact coinage debated, so we say 「蛮族的风格」, not a quote) |
| Baroque: origin uncertain; one etymology is Portuguese *barroco*, an irregular pearl; pejorative until Wölfflin (1888) | Britannica, "Where does the term Baroque come from?" — hence 「一说」 |
| Last Supper: vanishing point at Christ's right temple; a nail hole there, found in the 1978–99 restoration, anchored Leonardo's perspective strings | Britannica "Last Supper"; UNESCO/NHK documentary narration; discoveringdavinci.com |
| Leroy coined "impressionists" mocking Monet's *Impression, soleil levant*, *Le Charivari*, 25 April 1874 | Wikipedia "Louis Leroy"; MIT OCW 4.602 lecture notes |
| Manet never showed in the eight Impressionist exhibitions; in 1865 he was congratulated for Monet's seascapes (alphabetical hang) | Wikipedia "First Impressionist Exhibition"; Seattle Art Museum blog (Rewald, *History of Impressionism*) — not on screen beyond 「莫奈 ≠ 马奈」 |
| Water lilies (睡莲) are Monet's | general knowledge (Orangerie cycle) |
| Musée d'Orsay is the former Gare d'Orsay, built 1898–1900 for the 1900 Exposition; museum opened Dec 1986; largest Impressionist & Post-Impressionist collection | Britannica "Musée d'Orsay"; Wikipedia |
| "Fauves": Louis Vauxcelles, *Gil Blas*, Salon d'Automne 1905 ("Donatello chez les fauves") | Wikipedia "Louis Vauxcelles"; Larousse "fauvisme" (exact issue date 17 vs 27 Oct varies, so only the year is shown) |
| "Cubes": Vauxcelles again, *Gil Blas*, 14 Nov 1908, on Braque ("réduit tout… à des cubes") | Wikipedia "Cubism", "Louis Vauxcelles" |
| Black Square: Tretyakov X-ray study (2015) found two earlier compositions underneath (Cubo-Futurist and proto-Suprematist) | artnet News (Nov 2015); Smithsonian Magazine "X-rays unveil two hidden paintings…" |
| *Fountain* 1917 signed "R. Mutt"; the original was lost (survives in Stieglitz's photo); replicas from the 1950s–60s | Wikipedia "Fountain (Duchamp)"; Tate |
| Rothko (1951): he paints large pictures "to be very intimate and human… you are in it" — the 进阶动作 paraphrases this | MoMA symposium, *Interiors*, May 1951 (quoted by Guggenheim Bilbao) |
| "Form ever follows function": Louis Sullivan, "The Tall Office Building Artistically Considered", *Lippincott's*, 1896 | smow journal; baunetzwissen; Wikipedia |
| Bauhaus 1919 (Weimar) – 1933 (Berlin); Dessau building by Gropius 1925–26 with a three-storey glass curtain wall | Bauhaus Dessau Foundation; Dezeen |
| Bauhaus colour: primaries (Kandinsky's 1923 questionnaire paired yellow/red/blue with triangle/square/circle) | Kandinsky's Bauhaus questionnaire literature — supports 「包豪斯可是三原色」 |
| "Less is more" (Mies, *weniger ist mehr*) vs "Less is a bore" (Venturi, *Complexity and Contradiction in Architecture*, 1966) | Architizer; Payette; Venturi obituaries |
| Art Deco named after the 1925 Paris Exposition des Arts Décoratifs (term itself from the 1960s) | Wikipedia "Art Deco"; Dezeen Art Deco centenary |
| High-tech "inside-out" pipes (blue air, green water, yellow electricity, red circulation) — Centre Pompidou 1977, mocked as a "refinery" | NPR (2017), TheCollector — **drawn generically, no text on screen beyond the tag** |

Dropped as uncertain: "Starry Night was painted in daylight" (sources disagree); the Dada dictionary legend.

## Beat sheet (seconds; bars of 2 s)

| t | Bar | Picture | Text | Music | Sound |
|---|---|---|---|---|---|
| 0.0 | 1 | Black Square on a white wall, the couple from behind, slow push-in | — | lounge theme bar 1 (piano, upright bass, brushes) | room murmur, one heel step |
| 0.4 | | she turns to profile (anticipation lean) | bubble 「你觉得这幅画在表达什么？」 (chars on 16ths) | | soft paper pop on bubble |
| 2.0 | 2 | **punch-in** on him (0.28 s, overshoot) | | stab | air whoosh (short) |
| 2.25 | | sweat drop forms and slides | 「呃……」 | | water-drop pluck (synth, A5) |
| 3.0 | | **freeze-frame**: desaturate, grain, 2% zoom | 「（大脑一片空白）」 | **tape-stop** 2.85→3.3, silence | room tone cuts |
| 4.0 | 3 | colour returns, pull back; guide card slams in (spring) | 「别慌。」 → 「教你在美术馆里，装得比导览还专业。」 | theme restarts (piano pickup at 3.75) | card slap (paper) |
| 7.5 | 4 | **whip-pan left** with motion blur | card flicks away | harpsichord pickup run | air whoosh peaks at 8.0 |
| 8.0 | 5 | lands in a Gothic nave (wide) | stamp №1 「被骂出来的名字」 | choir open fifth + low strings | stamp thump; stone room tone |
| 8.8 | | **architecture rebuild** Gothic → Baroque palace; brush strokes sweep in | hall title 「古典馆」 + tag | harpsichord flourish (stinger) | stone grinding, brush swish |
| 10.0 | 6 | dolly to *The Last Supper*, couple walks (steps on beats) | ID card 文艺复兴 | theme on harpsichord, violin counterline, cello continuo | footsteps; card slide |
| 12.0 | 7 | perspective lines draw to the vanishing point; heads follow | 进阶动作 card | pizzicato 8ths | pencil scratch ×4 on 8ths, harpsichord ping at VP |
| 13.5 | | | 装逼台词 card (gilded engraved serif) | sequence | card slide |
| 14.8 | 8 | she turns to him (reaction beat) | | | |
| 16.0 | 9 | dolly to Caravaggio; lights drop to a raking spotlight; style → Baroque | ID card 巴洛克 + stamp №2 | D minor, string tremolo | brush swish, stamp thump |
| 18.0 | 10 | punch-in on him | 「哇，跟照片一样！」 → 踩雷 card | stop, harpsichord "dud" | soft dud (low thump) |
| 19.6 | 11 | **dabs bloom**: palace → railway hall (iron vault, giant clock) | hall title 「印象派馆」 + tag | harp glissando pickup | iron settling, brush swish |
| 22.0 | 12 | dolly to Monet | ID card 印象派 | theme on flute, harp arpeggios, piano 9ths | footsteps; card |
| 24.0 | 13 | | 装逼台词 + stamp №3 | | stamp thump (−4 dB vs №1) |
| 26.0 | 14 | the couple step back 3 steps; **eyelid squint**: frame narrows, dabs fuse | 进阶动作 card | whole-tone wash | 3 footsteps on beats |
| 28.0 | 15 | dots resolve (Seurat) → dots swirl (van Gogh); dolly to *Starry Night* | ID card 后印象派 | pizzicato 16ths → harp/piano swirls | dot patter, swirl swish |
| 30.0 | 16 | punch-in | 「马奈的睡莲真美！」 → MONET→MANET flip | the theme with a wrong note | dud |
| 31.6 | 17 | **paint-roller wipe** to the white cube; track lights click on | hall title 「现代与抽象馆」 | brush-snare fill, walking bass enters | roller swish, 4 light clicks on 8ths |
| 34.0 | 18 | Fauve **paint splash** | ID 野兽派 + stamp №4 | hemiola stab (brass) | splash swish, stamp |
| 35.5 | | Cubist **facets shatter & reassemble** | ID 立体派 + stamp №5 | angular piano cluster | glassy-free facet clicks |
| 37.0 | 19 | **blocks** → Suprematist; at the Black Square | ID 抽象 · 「开头那幅！」 | band drops: bass + vibes | soft block thuds |
| 38.5 | | X-ray scan bar crosses the square, ghost layers glow | 装逼台词 「它底下，还藏着两幅画。」 | cool vibes theme | soft scanner hum |
| 41.0 | 20½ | **torn paper** collage | ID 达达 (cut-letter type) | cabaret oom-pah (accordion, tuba) | paper tear |
| 42.5 | 21¼ | colour **bleeds**; camera pushes into the colour field | 进阶动作 「站近一点，让颜色包住你」 | free cool jazz, reverb bloom | steps forward |
| 44.5 | 22¼ | **Ben-Day halftone wipe** | ID 波普 (halftone speech bubble) | bright synth-brass stab, claps | pop |
| 46.0 | 23 | punch-in | 「这我也能画。」 → 「这句，千万别说。」 | band stops; bass slides down | dud |
| 47.6 | 24 | **grid blocks slide in**: glass curtain wall assembles | hall title 「设计馆」 | marimba + synth minimal groove | panel clicks on 16ths |
| 50.0 | 25 | whiplash-curve wipe → Mucha | ID 新艺术运动 | harp/flute curl over the groove | synth blip |
| 51.5 | | sunburst wipe → Deco | ID 装饰艺术 | Deco swing button (brass stab) | synth blip |
| 53.0 | 26½ | grid blocks → Bauhaus | ID 包豪斯 | strict minimal | synth blip |
| 54.5 | | | 装逼台词 (Sullivan) — grid-set sans | | |
| 57.0 | 28½ | ruler lines snap a grid over poster and façade | 进阶动作 | blips on each line | pencil/ruler ticks |
| 58.5 | | punch-in | 「好"性冷淡风"啊。」 → 「包豪斯可是三原色。」 | groove stutters | dud |
| 60.5 | 30¼ | wall text 「少即是多。」 … | | everything drops to one note | |
| 61.0 | | … slapped by 「少即是无聊。」; pipes burst out in four colours | tag 「建筑：高技派」 | full band, colourful, 1 bar | pipe clanks (soft), pop |
| 61.6 | | **whip-pan back** to the Black Square | | lounge pickup | whoosh |
| 62.2 | 31 | bookend framing of the hook | 「所以……它在表达什么？」 | lounge theme | murmur |
| 64.0 | 32 | he steps closer, calm (no sweat) | 「它底下，还藏着两幅画。」 → her 「哇。」 | theme, confident swing | step |
| 65.6 | 33 | blurred passer-by crosses the foreground | 「这我也能画。」 | walking bass up | footsteps L→R |
| 66.6 | | **beat of stillness** | | silence | — |
| 66.85 | | | 「但你没有。」 | piano stab | |
| 67.6 | 34 | push into the black square (zoom-through); two glasses enter on black | | swell (strings, harp) | |
| 68.0 | 35 | **clink on the final downbeat** | 「Cheers.」 | full ensemble F6/9 | real wine-glass clink |
| 69.5 | | pull back: black square → couple → museum in cross-section (four halls) | 「看不懂也没关系， / 艺术本来就是拿来聊的。」 | hold, theme tag on piano | room tone fades |
| 71.8–73 | 36 | hold | credits (small) | ring-out | — |

## Transition chain (what carries across every cut)

| # | From → to | Device | Carry |
|---|---|---|---|
| 1 | hook → Gothic | whip-pan with motion blur, landing on the bar | the couple (whipped along), motion direction |
| 2 | Gothic → palace | **architecture rebuild**: pointed arches round off, coffers drop in, damask floods; brush strokes sweep | same space, couple, the stamp |
| 3 | Renaissance → Baroque | brush sweep + light drop to a raking beam (dolly) | couple, painting wall |
| 4 | palace → station | **dabs bloom**; vault lifts into iron ribs and glass; clock fades in | couple walking, colour of the light |
| 5 | Impressionism → pointillism → van Gogh | dabs break into dots; dots stretch into swirls | the couple's silhouette, stroke field |
| 6 | station → white cube | paint-roller wipe; ribs flatten; track lights click on | couple, wall plane |
| 7–12 | quick-fire styles | splash / facets shatter / blocks / torn paper / colour bleed / Ben-Day wipe | the couple restyled in place; the wall; the stamp gag |
| 13 | cube → design | grid blocks slide in; curtain wall assembles | couple, grid |
| 14–16 | Nouveau / Deco / Bauhaus | whiplash curve, sunburst, grid | couple |
| 17 | design → high-tech | pipes burst out of the walls | the wall text pair |
| 18 | → ending | whip-pan back | the black square (bookend of frame 1) |
| 19 | ending → clink | zoom-through into the black square | black fills the frame; glasses enter on black |
| 20 | clink → finale | zoom-out (black square → couple → museum in section) | the black square |

## Motion system (`src/artdate/motion.ts`)
- Easings: `outExpo` for text/cards in, `inCubic` for exits, `inOutSine` for camera dollies, `punch` (fast out-back) for
  comic punch-ins, `whip` (in-out-quint with a motion-blur envelope). Nothing linear except camera drift and particles.
- Springs: cards and stamps land with a damped spring (ζ≈0.55, ~6% overshoot); stamps add a 1.5° rotation settle.
- Stagger: characters on 1/16 notes (62.5 ms), card rows on 1/8 notes (250 ms) → 40–80 ms per item rule.
- Follow-through: her ponytail and his scarf tail are spring-driven by the walk; card shadows lag the card; picture
  frames wobble 0.6° when the camera lands.
- Camera: dollies along the wall with parallax (couple at 1.6 m, props nearer); rack focus (scene blur 0→3 px) when a
  card is the focus; whip-pans with directional blur; punch-ins on blunders; a freeze on the panic.
- Comedic timing: freeze + silence (3.0–4.0); a beat of stillness before 「但你没有。」; her reaction 0.8–1.3 s after
  each 装逼台词; her side-eye 0.3 s after each 踩雷.
- Kinetic type per hall: 古典 gilded engraved serif; 印象派 soft-focus reveal; 达达 cut-paper letters; 波普 halftone
  speech bubble; 设计 geometric sans on a grid.

## Music plan (`music/artdate.py`, 120 BPM, F major family)
One chic 4-bar leitmotif (Fmaj9 | Dm9 | Gm9 C13 | Fmaj7), a leap of a sixth then a turn, re-orchestrated per hall:
- **Hook**: lounge — Salamander piano, upright bass, brushes, vibraphone. **Panic**: tape-stop (pitch and speed ramp to
  zero over 0.45 s), 0.7 s of silence. **别慌**: piano pickup, theme restarts.
- **古典**: Gothic choir fifth on landing; harpsichord (GM 6) carries the theme straight-8ths, violin counter-melody,
  cello continuo; Baroque beat goes to D minor with tremolo; palace reverb (stone, RT ≈ 3.4 s, warm).
- **印象派**: harp glissando bridge; flute theme over harp arpeggios and piano 9th chords with whole-tone colour;
  pizzicato 16ths for the dots, harp/piano sextuplet swirls for van Gogh; station reverb (airy, bright, RT ≈ 2.6 s).
- **现代**: brush-snare fill bridge; jazz trio with walking bass and clarinet; hemiola stabs (every 3 beats) on the
  quick-fire cards; the band drops for the black square; cabaret accordion/tuba for Dada; free cool jazz for the
  colour field; a bright pop stab; dry white-cube room (RT ≈ 0.8 s).
- **设计**: marimba + synth pluck interlocking 8ths, tight drum machine (Bauhaus precision), a Deco brass button;
  "less" = one note, "a bore" = full band; crisp design-hall room (RT ≈ 1.1 s, bright).
- **Ending**: lounge returns; stop-time before the retort; swell; **wine-glass clink on the final downbeat (68.0)**
  with the full ensemble on F6/9, then a 5-s hold.

## Sound design (one soft palette, 8–12 dB under the music)
Room tones per hall (church murmur in the palace, lobby murmur + footsteps in the station, quiet indoor murmur in
the cube); footsteps (heels) on every walk, on the beat; card slide/flip = paper; brush swish (synthesised, band-passed
noise) for paint-in transitions; pencil scratch for the perspective lines; air whoosh for whip-pans; water-drop pluck
(synthesised, in key); tape-stop on the music; stone grinding / iron settling / panel clicks for the architecture
morphs; stamp = soft low thump + paper; dud = muted low thump; synth blips for design cards; a real wine-glass clink.
No bells, chimes or glitter; every library effect checked with `sfxlib.harsh` (the stock water-drop and brush
transition were flagged HARSH and are replaced by synthesised versions). Each hall's reverb is applied to its sounds.

## Cue sheet
Generated by `music/artdate.py` into `out/artdate_cues.md` (motion event → sound → music beat → level vs music).
