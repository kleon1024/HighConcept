# 看不懂也能装：美术馆约会腔调指南 — storyboard (final)

Landscape 4:3 · 1440×1080 · 30 fps · **73.0 s** (36½ bars at 120 BPM, 2-s bars) · Remotion composition `ArtDate`.
Timing, text and camera live in `src/artdate/artdate.json`. The score (`music/artdate.py`) reads the same file, so
every sound sits on the frame of its visual event.
Deliverables: `release/ART_DATE_GUIDE.mp4` (master), `release/ART_DATE_GUIDE_share.mp4` (share copy), and contact
sheets in `release/` (one frame per second, plus ±2 frames at every cut).

**One-sentence story**: on a museum date he panics in front of a black square. A pocket guide walks him through four
halls and five centuries of architecture, and he blunders at every 踩雷. At the end he answers the same question
smoothly, shuts down 「这我也能画」 with 「但你没有」, and they clink glasses.

- **有用**: a 4-part kit per hall (一秒认出 / 装逼台词 / 进阶动作 / 踩雷), built on real, checkable facts.
- **有趣**: his blunders; her side-eye and raised eyebrow; the running stamp 「又一个被骂出来的名字」 (№1 → №5);
  the X-ray line that comes back as the ending's answer.
- **新奇**: the couple and the gallery repaint into each movement's style. The building rebuilds from a Gothic nave to
  a Baroque palace, a railway hall, a white cube, a Bauhaus curtain wall and high-tech pipes. The closing zoom-out shows
  the whole museum in cross-section.

## Format and grid
- Safe margin: 70 px on all sides. Speech bubbles are clamped inside it, including during the push-in.
- Left ⅔: the painting on the wall, with the couple seen from behind (Rückenfigur) who turn to profile to talk.
- Right column (x 912–1370): the kit card. One card per beat; cards land on a stack.
- Top-left: the hall title and the architecture tag.
- Bottom-left: the credit line for the real work on screen.
- Camera: a pinhole camera facing the long gallery wall (`world.ts`) and trucking along it, in world metres. The halls
  are laid out left to right: 古典 x≈−60…−40, 印象派 −30…−13, 现代 0…25, 设计 30…46. The black square hangs at x = 10
  (hook, mid-film and ending).

## Cast (original drawings, never real likenesses)
- **他** (the protagonist, left): camel overcoat, a mustard-and-navy scarf, dark hair. Seen from behind; he turns to
  profile to talk. Poses: chin-stroke, shrug, pointing, excitement, a proud chin-up.
- **她** (the date, right): burgundy dress, low chestnut ponytail, small gold earrings. She asks the question and reacts
  with a lean, a smile, side-eye, a raised eyebrow, crossed arms or an eye-roll.
- **路人**: a soft-focus foreground silhouette who says 「这我也能画。」 at the end.
- **Gallery life**: a visitor at the urinal plinth, benches, stanchions in the palace, a bench in the station.

## Movements, kit lines and real works (13 movements and 6 buildings)

| Hall | Movement · 一秒认出 | Work on the wall | Licence |
|---|---|---|---|
| 古典馆 | 文艺复兴 · 「透视 · 对称 · 柔光」 | 达·芬奇《最后的晚餐》1495–98 | PD, Commons |
| 古典馆 | 巴洛克 · 「黑底 · 追光 · 戏剧感」 | 卡拉瓦乔《圣马太蒙召》1599–1600 | PD-Art, Commons |
| 印象派馆 | 印象派 · 「碎笔触 · 户外光」 | 莫奈《印象·日出》1872 | PD, Commons |
| 印象派馆 | 后印象派 · 「修拉点点，梵高转圈」 | 梵高《星月夜》1889 | PD, Commons |
| 现代与抽象馆 | 野兽派 · 「脸可以是绿的」 | 马蒂斯《马蒂斯夫人像（绿线）》1905 | Public Domain Mark, SMK Open |
| 现代与抽象馆 | 立体派 · 「一张脸，多角度」 | 胡安·格里斯《毕加索肖像》1912 | PD, Commons |
| 现代与抽象馆 | 抽象 · 「只剩形状色彩」 | 马列维奇《黑方块》1915 | PD, Commons |
| 现代与抽象馆 | 达达 · 「小便池也算艺术」 | own drawing of a urinal signed "R. MUTT 1917" (示意图) | original |
| 现代与抽象馆 | 抽象表现主义 (the 进阶动作 beat) | own colour-field canvas (风格示意) | original |
| 现代与抽象馆 | 波普 · 「网点 · 漫画 · 广告」 | own Ben-Day comic panel (风格示意) | original |
| 设计馆 | 新艺术运动 · 「藤蔓曲线」 | 穆夏《遐想》Rêverie 1897 (for F. Champenois) | PD, Commons |
| 设计馆 | 装饰艺术 · 「金色放射线」 | own Deco poster (风格示意) | original |
| 设计馆 | 包豪斯 · 「方圆三角 · 三原色」 | own Bauhaus poster (风格示意) | original |

**Not shown:**
- Picasso/Braque, Dalí/Magritte, Pollock/Rothko, Warhol/Lichtenstein and Breuer chairs. Copyrighted movements get
  original pastiches labelled 「风格示意」.
- The Stieglitz photo of *Fountain*.

**Architecture:** drawn generically (no real façades), one hall at a time:

| Building | Time | Look |
|---|---|---|
| Gothic nave | 7.75 | ribbed vault, lancet windows, light shafts |
| Baroque palace gallery | 8.8 | painted coffered vault with sky panels, gilded pilasters, red damask |
| Railway hall | 20.0 | glazed iron vault, ribs and purlins, arcade, station clocks, cast-iron columns |
| White cube | 32.0 | track rails with spots, light pools, wall labels |
| Bauhaus curtain wall | 48.0 | glass grid, outside wing, a red column |
| High-tech | 60.4 | colour-coded pipes bursting out |

### The kit, hall by hall (every line on screen, with on/off times)

**Hook (0–8)**
| Time (s) | Who / item | Text |
|---|---|---|
| 0.5–2.15 | her | 「你觉得这幅画 / 在表达什么？」 |
| 2.25 | sweat drop | — |
| 2.5–4.1 | him | 「呃……」 |
| 3.0–4.0 | freeze | 「（大脑一片空白）」 |
| 4.0–7.55 | guide card | 「看不懂也能装 · 美术馆约会腔调指南」 / 「别慌。」 / 「教你在美术馆里， / 装得比导览还专业。」 |

**古典馆 (8–20)** · tag 「建筑：哥特 → 巴洛克宫殿长廊」
| Time (s) | Item | Text |
|---|---|---|
| 8.3–10.4 | stamp №1 on the Gothic nave | 「被骂出来的名字」 · 「"哥特"＝蛮族的风格」 |
| 10.5 | ID card | 文艺复兴 |
| 12.0 | 进阶动作 | 「顺着透视线，找消失点」 (lines draw themselves to Christ's right temple) |
| 13.5–15.85 | 装逼台词 | 「"消失点那儿，至今留着一个钉孔。"」 · note 「达·芬奇在此钉钉、拉线定透视」 |
| 16.5 | ID card | 巴洛克 |
| 17.0 | stamp №2 | 「又一个被骂出来的名字」 · 「Barroco：一说原意"歪珍珠"」 |
| 17.95–19.2 | him (踩雷) | 「哇，跟照片一样！」 |
| 18.4 | card | 「那时候，还没有照片。」 |

**印象派馆 (20–32)** · tag 「建筑：火车站大厅 · 奥赛博物馆原是火车站（1900）」
| Time (s) | Item | Text |
|---|---|---|
| 22.5 | ID card | 印象派 |
| 24.0–26.2 | 装逼台词 | 「"'印象派'这名字，本来是评论家骂人的。"」 · note 「勒鲁瓦，《喧哗》报，1874」 |
| 24.8 | stamp | №3 |
| 26.25 | 进阶动作 | 「后退三步，眯眼看」 (the frame narrows like eyelids, 26.9–27.8, and the dabs fuse) |
| 28.5 | ID card | 后印象派 |
| 29.95–31.2 | him (踩雷) | 「马奈的睡莲真美！」 |
| 30.4 | card | 「莫奈 ≠ 马奈」 (the O flips to an A: MONET → MANET) |

**现代与抽象馆 (32–48)** · tag 「建筑：白盒子展厅」 · quick-fire, about 1.4 s per card
| Time (s) | Item | Text |
|---|---|---|
| 34.0 | ID card | 野兽派 |
| 34.2 | stamp №4 | 「沃克塞勒骂它"野兽"」 |
| 35.5 | ID card | 立体派 |
| 35.7 | stamp №5 | 「还是他："立方体"」 |
| 37.0 | ID card | 抽象 · 「开头那幅！」 |
| 38.5–40.85 | 装逼台词 | 「"它底下，还藏着两幅画。"」 · note 「2015 年特列季亚科夫画廊 X 光检测」 (X-ray scan, labelled 「X 光 · 示意」) |
| 41.0 | ID card | 达达 (cut-paper letters) |
| 42.5 | 进阶动作 | 「站近一点，让颜色包住你」 |
| 44.5 | ID card | 波普 (halftone type) |
| 45.95–47.2 | him (踩雷) | 「这我也能画。」 |
| 46.4 | card | 「这句，千万别说。」 (planted for the ending) |

**设计馆 (48–62)** · tag 「建筑：包豪斯玻璃幕墙（德绍，1926）」
| Time (s) | Item | Text |
|---|---|---|
| 50.0 | ID card | 新艺术运动 |
| 51.5 | ID card | 装饰艺术 |
| 53.0 | ID card | 包豪斯 |
| 54.5–56.95 | 装逼台词 | 「"'形式追随功能'，其实出自沙利文。"」 · note 「美国建筑师路易斯·沙利文，1896 年」 |
| 57.0 | 进阶动作 | 「找网格：一切都对齐」 |
| 58.3–59.55 | him (踩雷) | 「好"性冷淡风"啊。」 |
| 58.75 | card | 「包豪斯可是三原色。」 |
| 60.15–61.75 | wall text (architecture pair) | 「少即是多。—— 密斯」 |
| 60.55–61.75 | slapped over it | 「少即是无聊。—— 文丘里，1966」 |
| 60.55 | tag | 「建筑：高技派（蓬皮杜中心，1977）」 (the building turns inside-out) |

**Ending (62–73)**
| Time (s) | Who / item | Text |
|---|---|---|
| 62.5–64.0 | her | 「所以…… / 它在表达什么？」 |
| 64.25–65.6 | him (calm, steps closer) | 「它底下， / 还藏着两幅画。」 |
| 65.0–66.05 | her | 「哇。」 |
| 65.6–66.85 | passer-by | 「这我也能画。」 |
| 66.6–66.84 | — | a stillness beat |
| 66.85–68.05 | him (proud chin-up) | 「但你没有。」 |
| 68.0–69.5 | clink | 「Cheers.」 |
| 69.5 / 70.1–73 | final line | 「看不懂也没关系， / 艺术本来就是拿来聊的。」 |
| 71.5–73 | credits | 「名画为公有领域（Wikimedia Commons / SMK Open）」 / 「标"风格示意"者为本片原创仿作」 |

Reading load: every card and bubble is held at least 1.2 s, at 5–7 Chinese characters per second.

Exceptions:
- Her 「哇。」 (one character, 1.05 s).
- 「但你没有。」: 1.2 s on screen, about 1.1 s fully legible as the camera pushes in.

## Facts and sources (checked 2026-10-12)

| Claim on screen | Source / note |
|---|---|
| "Gothic" began as a Renaissance put-down: Vasari blamed the "barbarous German style" on the Goths | Wikipedia "Gothic architecture"; British Art Studies, *Imagining Invention* (notes Filarete's "gente barbara"). The exact coinage is debated, so the screen says 「蛮族的风格」, not a quote. |
| Baroque: origin uncertain; one etymology is the Portuguese *barroco*, an irregular pearl; pejorative until Wölfflin (1888) | Britannica, "Where does the term Baroque come from?" — hence 「一说」 |
| Last Supper: vanishing point at Christ's right temple; a nail hole there, found in the 1978–99 restoration, anchored Leonardo's perspective strings | Britannica "Last Supper"; UNESCO/NHK documentary narration; discoveringdavinci.com |
| Leroy coined "impressionists" mocking Monet's *Impression, soleil levant*, *Le Charivari*, 25 April 1874 | Wikipedia "Louis Leroy"; MIT OCW 4.602 lecture notes |
| Monet ≠ Manet; water lilies (睡莲) are Monet's | general knowledge (the Orangerie cycle); Manet never showed in the eight Impressionist exhibitions (Wikipedia "First Impressionist Exhibition") |
| Musée d'Orsay is the former Gare d'Orsay, built 1898–1900 for the 1900 Exposition; the museum opened Dec 1986 | Britannica "Musée d'Orsay"; Wikipedia |
| "Fauves": Louis Vauxcelles, *Gil Blas*, Salon d'Automne 1905 ("Donatello chez les fauves") | Wikipedia "Louis Vauxcelles"; Larousse "fauvisme". The exact issue date (17 vs 27 Oct) varies, so only the name and year are used. |
| "Cubes": Vauxcelles again, *Gil Blas*, 14 Nov 1908, on Braque ("réduit tout… à des cubes") | Wikipedia "Cubism", "Louis Vauxcelles" |
| Black Square: a Tretyakov X-ray study (2015) found two earlier compositions underneath (Cubo-Futurist and proto-Suprematist) | artnet News (Nov 2015); Smithsonian Magazine "X-rays unveil two hidden paintings…" — the scan on screen is labelled 示意 |
| *Fountain* 1917, signed "R. Mutt"; the original was lost (it survives in Stieglitz's photo); replicas from the 1950s–60s | Wikipedia "Fountain (Duchamp)"; Tate |
| Rothko (1951): he paints large pictures "to be very intimate and human… you are in it" — the 进阶动作 paraphrases this | MoMA symposium, *Interiors*, May 1951 (quoted by Guggenheim Bilbao) |
| "Form ever follows function": Louis Sullivan, "The Tall Office Building Artistically Considered", *Lippincott's*, March 1896 | smow journal; baunetzwissen; Wikipedia |
| Bauhaus 1919 (Weimar) – 1933 (Berlin); Dessau building by Gropius 1925–26 with a glass curtain wall | Bauhaus Dessau Foundation; Dezeen |
| Bauhaus colour: primaries (Kandinsky's 1923 questionnaire paired yellow/red/blue with triangle/square/circle) | Bauhaus questionnaire literature — supports 「包豪斯可是三原色」 |
| "Less is more" (Mies) vs "Less is a bore" (Venturi, *Complexity and Contradiction in Architecture*, 1966) | Architizer; Payette; Venturi obituaries |
| Centre Pompidou 1977, "inside-out" with colour-coded services | NPR (2017); TheCollector — drawn generically; only the tag names it |

Dropped as uncertain: "Starry Night was painted in daylight" (sources disagree) and the Dada dictionary legend.

## Beat sheet (final timings; seconds, bars of 2 s)

| t | Bar | Picture / camera | Text | Music | Sound |
|---|---|---|---|---|---|
| 0.0 | 1 | Black Square on a white wall, the couple from behind; slow push | — | lounge: piano theme, upright bass, brushes, vibes | white-cube murmur, a heel step |
| 0.5 | | she turns to profile | 「你觉得这幅画在表达什么？」 | | soft bubble pop |
| 2.0–2.28 | 2 | **punch-in** on him (out-back overshoot) | | stab | air whoosh (short) |
| 2.25 / 2.5 | | sweat drop slides | 「呃……」 | | water-drop pluck (synth) |
| 3.0–4.0 | | **freeze**: desaturate, grain, 2 % scale | 「（大脑一片空白）」 | **tape-stop** 2.85→3.3, silence | room tone cut |
| 4.0–4.75 | 3 | colour returns; slow ease-out pull back; guide card slams in | 「别慌。」 → 「教你在美术馆里，装得比导览还专业。」 | piano pickup at 3.75, theme restarts | card slap + low thump |
| 7.5–8.0 | 4 | **whip-pan left** with streak blur; the Gothic nave cuts in at mid-whip (7.75) | | harpsichord run | air whoosh peaks at 7.75 |
| 8.0 | 5 | lands in the Gothic nave | stamp №1 (8.3) | choir/strings organum on G–D | stamp thump; stone room |
| 8.8–9.8 | | **rebuild** Gothic → Baroque palace (stone mask); brush strokes paint it in | hall title 古典馆 + tag (9.2) | harpsichord flourish (stinger) | stone grind, brush swish |
| 10.0–10.6 | 6 | dolly to *The Last Supper*; the couple walk on the beat | ID 文艺复兴 (10.5) | theme on harpsichord, violin countermelody, cello continuo | heels, card slide |
| 12.0 | 7 | perspective lines draw to the vanishing point | 进阶动作 | pizzicato line, a harpsichord ping at the VP (13.25) | pencil ticks |
| 13.5–15.6 | | two-shot (13.95): she turns, impressed (reaction beat) | 装逼台词 (nail hole) | band ducked −3 dB; violin reaction 14.8 | card slide |
| 16.0–16.6 | 9 | dolly to Caravaggio; the light drops to a raking beam; Baroque oil | ID 巴洛克 + stamp №2 | D minor: harpsichord 16ths, string tremolo, cello pedal | brush swish, stamp |
| 17.95–18.4 | 9–10 | **punch-in** (18.25); she side-eyes him | 「哇，跟照片一样！」 → 「那时候，还没有照片。」 | a delighted trill, then the dud | dud (low thump) + paper |
| 19.5–20.0 | 10 | whip-pan (dabs) | | harp glissando bridge | whoosh |
| 20.0–21.0 | 11 | **rebuild** palace → railway hall (iron mask); dabs bloom | hall title 印象派馆 (20.6) | piano 9ths + flute | iron settling, lobby murmur |
| 22.4 | 12 | dolly to Monet | ID 印象派 | theme on flute over harp arpeggios | heels, card |
| 24.0–25.8 | 13 | two-shot (24.45): she laughs | 装逼台词 (Leroy) + stamp №3 (24.8) | ducked −3 dB | stamp thump (softer) |
| 26.25–27.9 | 14 | they step back three steps; **eyelid squint** 26.9–27.8, the dabs fuse | 进阶动作 | whole-tone harp wash | three steps on beats |
| 28.0 / 28.9 | 15 | dots (Seurat) → swirls (van Gogh); dolly to *Starry Night* | ID 后印象派 (28.5) | pizzicato 16ths → harp/piano sextuplets | dot patter, swirl swish |
| 29.95–31.1 | 15–16 | **punch-in** (30.25); eye-roll | 「马奈的睡莲真美！」 → 「莫奈 ≠ 马奈」, letter flip at 31.1 | the theme with a wrong note | dud, card flick |
| 31.5–32.0 | 16 | whip-pan; **paint-roller** wipe to the white cube; track lights | hall title 现代与抽象馆 (32.6) | brush-snare fill, walking bass | roller, whoosh, light clicks |
| 33.8–35.5 | 17–18 | Fauve **splash** → Cubist **facets** | ID 野兽派, stamp №4 · ID 立体派, stamp №5 | brass stab · piano cluster | splash, facet clicks, stamps |
| 36.8–37.2 | 19 | **blocks** → Suprematist couple; back to the Black Square | ID 抽象 · 「开头那幅！」 | the band drops: bass + one vibes note | block thuds |
| 38.5–40.9 | | X-ray scan bar; ghost layers glow; two-shot (39.95) | 装逼台词 「它底下，还藏着两幅画。」 | cool vibes theme | soft scanner hum |
| 40.8 | 21 | **torn-paper** collage (Dada); fast dolly | ID 达达 | cabaret oom-pah (tuba, accordion, honky-tonk) | paper tear |
| 42.3–43.4 | | colour **bleeds**; the camera pushes into the colour field | 进阶动作 「站近一点，让颜色包住你」 | free cool jazz, long "bloom" reverb | steps forward |
| 44.3–44.7 | 23 | push into the colour, **whip** with a Ben-Day halftone wipe | ID 波普 | bright brass stabs, claps, bouncy bass | soft pops ×3 |
| 45.95–46.4 | 23–24 | **punch-in** (46.25); arms crossed | 「这我也能画。」 → 「这句，千万别说。」 | the band stops; the bass slides down | dud |
| 47.5–48.9 | 24–25 | whip-pan; **grid** blocks; the curtain wall assembles (panel mask) | hall title 设计馆 (48.6) | synth blips → marimba/synth minimalism | panel clicks |
| 49.8 / 51.3 / 52.8 | 25–27 | whiplash → Mucha · sunburst → Deco · grid → Bauhaus | ID cards | harp curl · Deco brass button · strict minimal | brush swishes, blips |
| 54.5–56.7 | 28 | two-shot (54.95): she raises an eyebrow, then nods | 装逼台词 (Sullivan) | vibes theme, ducked −3 dB | card blip |
| 57.0 | 29 | ruler lines snap a grid over the poster and façade | 进阶动作 | blips on each line | pencil ticks |
| 58.3–58.75 | 30 | **punch-in** (58.55); her shrug | 「好"性冷淡风"啊。」 → 「包豪斯可是三原色。」 | dud, a soft held chord | dud |
| 60.0–60.55 | 31 | wall text 「少即是多。」; the building turns inside-out: **pipes** (60.4); 「少即是无聊。」 slaps over it | tag 高技派 | one marimba note → full band "bore" | soft mechanical clunk, pop |
| 61.75–62.0 | | **whip-pan** back to the Black Square (cut at 61.85) | | lounge pickup | whoosh ×2 |
| 62.5 | 32 | bookend framing of the hook | 「所以……它在表达什么？」 | lounge theme | murmur |
| 64.0–65.6 | 33 | he steps closer, calm (no sweat), chin-up; she leans in, smiles | 「它底下，还藏着两幅画。」 · 「哇。」 (65.0, on beat 3) | theme + vibes; a vibes chord on 「哇」 | step, pops |
| 65.4–67.4 | | a soft-focus passer-by crosses the foreground L→R | 「这我也能画。」 | walking bass | footsteps |
| 66.6–66.84 | 34 | **stillness beat**: everyone stops | | stop-time (band at −22 dB) | SFX dipped |
| 66.85 | | his proud chin-up | 「但你没有。」 | piano + brush + bass hit | |
| 67.62–68.0 | | ease-in-out push into the black square; glasses enter on black | (the bubble stays in the safe area) | strings swell + harp gliss | air swell |
| 68.0 | 35 | **clink on the final downbeat**, a warm flare, damped recoil | 「Cheers.」 | full ensemble F6/9 | real wine-glass clink (2936) |
| 69.2–72.0 | | zoom-out: black square → couple → the museum in cross-section, all six buildings | 「看不懂也没关系， / 艺术本来就是拿来聊的。」 over a dusk band | hold, the theme's tag on piano | room tone fades |
| 71.5–73 | 36 | hold; fade to black 72.6–73 | credits (small) | ring-out | — |

## Transition chain (what carries across every cut)

| # | Time | From → to | Device | Carry |
|---|---|---|---|---|
| 1 | 7.5–8.0 | hook → Gothic | whip-pan with streak blur; the swap is hidden at peak blur (7.75) | the couple (whipped along), motion direction, the whoosh |
| 2 | 8.8–9.8 | Gothic → palace | **architecture rebuild** (stone mask): pointed arches round off, coffers drop in; brush strokes paint the Renaissance look | same space, couple, the stamp |
| 3 | 16.0 | Renaissance → Baroque | brush sweep + a light drop to a raking beam (dolly) | couple, painting wall |
| 4 | 20.0–21.0 | palace → station | whip + **dabs bloom**; the vault lifts into iron ribs and glass (iron mask) | couple walking, colour of the light |
| 5 | 28.0 / 28.9 | Impressionism → pointillism → van Gogh | dabs break into dots; dots stretch into swirls | the couple's silhouette, stroke field |
| 6 | 32.0 | station → white cube | whip + paint-roller wipe; track lights click on | couple, wall plane |
| 7–12 | 33.8–44.7 | quick-fire styles | splash / facets / blocks / torn paper / colour bleed / Ben-Day halftone (with a whip) | the couple restyled in place; the wall; the stamp gag |
| 13 | 48.0 | cube → design | whip + grid blocks; the curtain wall assembles (panels) | couple, grid |
| 14–16 | 49.8 / 51.3 / 52.8 | Nouveau / Deco / Bauhaus | whiplash curve, sunburst, grid | couple |
| 17 | 60.4 | design → high-tech | pipes burst out of the walls | the wall-text pair |
| 18 | 61.75–62.0 | → ending | whip-pan back (cut at 61.85) | the black square (bookend of frame 1) |
| 19 | 67.62–68.0 | ending → clink | push into the black square | black fills the frame; glasses enter on black |
| 20 | 69.2–72.0 | clink → finale | zoom-out (black square → couple → museum in section) | the black square |

## Motion system (`src/artdate/motion.ts`)

**Easings** (custom curves):
- `outExpo` for text and cards coming in; `inCubic` for exits.
- `inOutSine` for camera dollies; `inOutCubic` (`zoomout`) for the pull-backs and the push-in.
- `punch` (out-back 1.25) for comic punch-ins; `whip` (in-out-quint).
- Nothing is linear except the slow camera drift.

**Springs**: cards and stamps land with a damped spring (ζ ≈ 0.55, a small overshoot); stamps add a rotation settle.
Speech bubbles spring from their tail.

**Stagger**: 31 ms per character on bubbles and cards (20 ms on quick-fire cards, 80 ms on the final line). Card rows
follow on 8th notes.

**Anticipation and follow-through**:
- Turns and leans have a counter-move.
- Her ponytail and his scarf are spring-driven by the walk.
- Picture frames wobble when the camera lands.
- The clink has a pull-back before contact and a damped recoil after it.

**Camera**:
- Dollies with parallax: the couple at 1.6 m, props nearer, the passer-by at 2.7 m in front.
- Rack focus: the scene blurs behind each 装逼 card.
- Whip-pans with a directional streak blur. Only segments whose destination key is eased `whip` get the streak. Other
  fast moves (the Dada dolly) get a short natural shutter smear capped at 60 px.
- Punch-ins on every blunder; a freeze on the panic.

**Comic timing**:
- Freeze and silence (3.0–4.0).
- A stillness beat before 「但你没有。」 (66.6–66.84).
- Her reaction 0.45–1.45 s after each 装逼台词 (two-shots at 13.95, 24.45, 39.95, 54.95).
- Her side-eye, shrug or eye-roll after each 踩雷.

**Kinetic type per hall**:
- 古典: gilded engraved serif.
- 印象派: soft-focus blur-in.
- 达达: cut-paper collage letters.
- 波普: halftone speech bubble with a hard shadow.
- 设计: geometric sans snapping to a grid.

**Texture**: the paint boils and the film grain updates at 10 fps (a hand-made cadence), not every frame.

## Music plan (`music/artdate.py`, 120 BPM, F major family)

**Leitmotif**: one chic 4-bar theme over F9 | Dm9 | Gm9 C13 | F9 C7b9. It opens with an A pickup that leaps a sixth to
F, then turns.

**Re-orchestration per hall**, each in its own room (convolution IRs):

| Section | Orchestration | Room |
|---|---|---|
| Hook | lounge: piano theme (swung), upright bass, brushes, vibes | — |
| Panic | tape-stop (speed and pitch ramp to zero, 2.85→3.3) and silence, then a piano pickup at 3.75 restarts the theme on 「别慌」 | — |
| 古典 | Gothic organum on the landing (choir and strings, G–D fifths); a harpsichord stinger on the rebuild; the theme on harpsichord with a violin countermelody and cello continuo; Baroque goes to D minor with harpsichord 16ths and string tremolo; 踩雷 = a trill and a dud cluster | palace: RT ≈ 3.4 s, warm |
| 印象派 | a harp glissando bridge; the theme on flute over harp arpeggios and piano 9ths; a whole-tone wash for the squint; pizzicato dots → harp/piano swirls; 踩雷 = the theme with a wrong note | station: RT ≈ 2.7 s, airy, with a metallic flutter |
| 现代 | a brush-snare fill bridge; a jazz trio with walking bass; a brass stab (Fauve), a piano cluster (Cubism); the band drops for the black square; a cool vibes theme for the X-ray; cabaret oom-pah (Dada); free cool jazz in a long bloom reverb (colour field); bright pop stabs; 踩雷 = full stop and a sliding bass | white cube: RT ≈ 0.85 s, dry |
| 设计 | synth blips bridge; marimba + synth-pluck minimalism with a tight drum machine; a harp curl (Nouveau), a Deco brass button, card blips; the vibes theme under Sullivan; "less" = one marimba note, "a bore" = full band | design: RT ≈ 1.15 s, crisp |
| Ending | lounge returns with the theme; a vibes chord on 「哇」; walking bass; stop-time; a piano/bass hit on 「但你没有」; strings swell and harp gliss; **the wine-glass clink lands on the final downbeat (68.0)** with the full ensemble on F6/9, then the theme's tag on piano under the last line | — |

**Bridges and hits**:
- Every hall change has a bridge: harpsichord run, harp gliss, brush fill or synth blips.
- Every hit is placed from the shared JSON and measured within +15 ms (under half a frame).

**Ducking**: the band dips 3 dB under the 装逼 line cards (13.5, 24.0, 54.5). The X-ray line and the 踩雷 cards get
arranged stops instead. The stop-time before 「但你没有。」 drops the band to −22 dB.

## Sound design (one soft palette, 8–12 dB under the music)

**Room tones per hall**: church/stone murmur in the palace, a lobby murmur with distant steps in the station, a quiet
murmur in the cube and the design hall. They are cut by the freeze and dipped in the stillness beat.

**Effects**:

| Motion | Sound |
|---|---|
| walks | heels on the beat |
| cards | paper slide / flick |
| stamps | soft low thump + paper |
| paint transitions | brush swish (synthesised band-passed noise) |
| perspective lines and grid | pencil ticks |
| whip-pans | air whoosh, peak-aligned to the swap |
| punch-ins | short air puff |
| sweat drop | water-drop pluck (synthesised, in key) |
| architecture morphs | stone grind (8.85) / iron settling (20.1) / panel clicks on 16ths (48.05–48.75); the station, cube and design rebuilds start on a bar line |
| Pompidou pipes | a soft mechanical clunk (3117) on the "bore" hit |
| blunders | dud |
| the clink | a real wine-glass clink |

There are no bells, chimes or glitter. Every library effect passed `sfxlib.harsh`; the flagged stock water-drop and
brush transitions are replaced by synthesised ones. Each hall's reverb is applied to its sounds, and all SFX are
low-passed at 9.5 kHz.

## Cue sheet and audio checks

The cue sheet is generated by `music/artdate.py` (into `out/artdate_cues.md`, which is git-ignored, so the full sheet is
copied in the appendix below). It has 162 rows, each with the motion event, sound, bar.beat, level and level vs music.

Checks on the release files:

| File | Video | Audio | Size | Loudness |
|---|---|---|---|---|
| `release/ART_DATE_GUIDE.mp4` | H.264 1440×1080, 30 fps, CRF 20, 73.0 s | AAC 192 kb/s, 48 kHz stereo | 74.0 MB | −16.2 LUFS integrated, true peak −3.2 dBFS, LRA 4.4 LU |
| `release/ART_DATE_GUIDE_share.mp4` | H.264 1152×864, CRF 23 | AAC 160 kb/s | 28.4 MB | −16.3 LUFS |

- Downscale: the share copy is 1152×864 because CRF 23 at 1440×1080 came to 46.7 MB.
- Biggest 0.2-s jumps: 8.4 dB (46.2, the 「这我也能画」 stop), 7.9 (19.4), 7.8 (3.4, the tape-stop), 7.6 (59.8, the
  "less" note). All are deliberate stops or entries.
- SFX vs music: median −13 dB over 162 cues; 150 of them sit 8 dB or more under the music. The ones within 8 dB (or
  above) sit where the band deliberately stops (the MONET/MANET flip, the 「这我也能画」 punch-in, the 踩雷 dud at 18.4) or at hall changes (room-tone entries, the roller and whoosh at 32.0, the brush strokes at 9.15).
- Audio sync: cross-correlation against `public/artdate_score.wav` gives a 0 ms offset in both files.
- Contact sheets: `release/ART_DATE_GUIDE_contact_per_second.jpg` (one frame per second) and
  `release/ART_DATE_GUIDE_contact_cuts.jpg` (42 cuts at −2, 0, +2 frames).

## Appendix: full cue sheet (from `music/artdate.py`)

"vs music" is the RMS of the SFX bus minus the RMS of the music over the next 0.35 s (negative = under the music).
Bars are 2 s (120 BPM); bar.beat counts from 1. Every time comes from `src/artdate/artdate.json`, the file the picture
reads.

| t (s) | bar.beat | motion event | sound | level (dB) | vs music (dB) |
|---|---|---|---|---|---|
|   0.00 | 1.1.00 | white cube murmur | room tone (2981) | -36 | -22.1 |
|   0.10 | 1.1.20 | a heel step in the room | footstep (heels, 542) | -34 | -20.8 |
|   0.50 | 1.2.00 | bubble: 你觉得这幅画 | pop_soft (1120) | -31 | -16.2 |
|   2.00 | 2.1.00 | punch-in | air_quick (2605) | -31 | -18.4 |
|   2.25 | 2.1.50 | sweat drop | water-drop pluck (synth, C6) | -27 | -16.3 |
|   2.50 | 2.2.00 | bubble: 呃…… | pop_soft (1120) | -33 | -15.1 |
|   4.00 | 3.1.00 | guide card slams in | card placement (2001) | -24 | -19.3 |
|   4.00 | 3.1.00 | guide card weight | low thump (synth) | -29 | -19.3 |
|   4.00 | 3.1.00 | white cube murmur | room tone (2981) | -37 | -19.3 |
|   7.75 | 4.4.50 | whip-pan → Gothic (cut hidden in the blur) | whoosh_air (1489) | -25 | -11.7 |
|   7.90 | 4.4.80 | palace: hushed church murmur | room tone (350) | -33 | -17.1 |
|   8.30 | 5.1.60 | stamp №1 | paper (2001) | -30 | -8.3 |
|   8.30 | 5.1.60 | stamp №1 | stamp body (synth) | -24 | -8.3 |
|   8.50 | 5.2.00 | walk | footstep (heels, 542) | -33 | -15.0 |
|   8.85 | 5.2.70 | Gothic → palace: stone grinding | stone slide (1528) | -28 | -10.6 |
|   8.90 | 5.2.80 | oil strokes sweep in | brush swish (synth) | -32 | -9.4 |
|   9.00 | 5.3.00 | walk | footstep (heels, 542) | -34 | -6.8 |
|   9.15 | 5.3.30 | oil strokes sweep in | brush swish (synth) | -32 | -6.1 |
|   9.40 | 5.3.80 | oil strokes sweep in | brush swish (synth) | -32 | -8.1 |
|   9.50 | 5.4.00 | walk | footstep (heels, 542) | -33 | -9.4 |
|  10.00 | 6.1.00 | walk | footstep (heels, 542) | -34 | -8.8 |
|  10.50 | 6.2.00 | id card lands | paper slide (1530) | -31 | -13.6 |
|  12.00 | 7.1.00 | move card lands | paper slide (1530) | -31 | -12.8 |
|  12.25 | 7.1.50 | perspective line drawn | pencil scribble (2369) | -31 | -10.2 |
|  12.50 | 7.2.00 | perspective line drawn | pencil scribble (2369) | -31 | -10.6 |
|  12.75 | 7.2.50 | perspective line drawn | pencil scribble (2369) | -31 | -13.1 |
|  13.00 | 7.3.00 | perspective line drawn | pencil scribble (2369) | -31 | -15.1 |
|  13.50 | 7.4.00 | line card lands | paper slide (1530) | -31 | -8.5 |
|  16.00 | 9.1.00 | Baroque glaze sweeps in | brush swish (synth) | -31 | -11.3 |
|  16.00 | 9.1.00 | walk | footstep (heels, 542) | -33 | -11.3 |
|  16.50 | 9.2.00 | walk | footstep (heels, 542) | -34 | -13.9 |
|  16.50 | 9.2.00 | id card lands | paper slide (1530) | -31 | -13.9 |
|  17.00 | 9.3.00 | stamp №2 | paper (2001) | -31 | -13.8 |
|  17.00 | 9.3.00 | stamp №2 | stamp body (synth) | -25 | -13.8 |
|  17.95 | 9.4.90 | bubble: 哇，跟照片一样！ | pop_soft (1120) | -31 | -11.4 |
|  18.00 | 10.1.00 | punch-in on the blunder | air_quick (2605) | -32 | -12.3 |
|  18.40 | 10.1.80 | 踩雷 | dud (synth) | -24 | -7.4 |
|  18.40 | 10.1.80 | mine card lands | paper slide (1530) | -31 | -7.4 |
|  19.80 | 10.4.60 | station: lobby murmur + steps | room tone (365) | -35 | -7.9 |
|  20.00 | 11.1.00 | whip-pan → station hall | whoosh_air (1489) | -27 | -8.8 |
|  20.05 | 11.1.10 | dabs bloom | brush dab (synth) | -34 | -10.1 |
|  20.10 | 11.1.20 | iron ribs settle | metal slide, low-passed (1534) | -31 | -10.4 |
|  20.27 | 11.1.54 | dabs bloom | brush dab (synth) | -34 | -11.4 |
|  20.49 | 11.1.98 | dabs bloom | brush dab (synth) | -34 | -11.2 |
|  20.71 | 11.2.42 | dabs bloom | brush dab (synth) | -34 | -9.4 |
|  21.00 | 11.3.00 | walk | footstep (heels, 542) | -33 | -9.2 |
|  21.50 | 11.4.00 | walk | footstep (heels, 542) | -34 | -12.5 |
|  22.00 | 12.1.00 | walk | footstep (heels, 542) | -33 | -18.4 |
|  22.50 | 12.2.00 | id card lands | paper slide (1530) | -31 | -14.2 |
|  24.00 | 13.1.00 | line card lands | paper slide (1530) | -31 | -13.8 |
|  24.80 | 13.2.60 | stamp №3 | paper (2001) | -31 | -10.2 |
|  24.80 | 13.2.60 | stamp №3 | stamp body (synth) | -25 | -10.2 |
|  26.00 | 14.1.00 | three steps back | footstep (542) | -30 | -14.9 |
|  26.25 | 14.1.50 | move card lands | paper slide (1530) | -31 | -13.2 |
|  26.50 | 14.2.00 | three steps back | footstep (542) | -30 | -13.1 |
|  26.90 | 14.2.80 | squint closes | air_quick (2605) | -35 | -13.1 |
|  27.00 | 14.3.00 | three steps back | footstep (542) | -30 | -12.5 |
|  28.00 | 15.1.00 | walk | footstep (heels, 542) | -33 | -13.8 |
|  28.50 | 15.2.00 | id card lands | paper slide (1530) | -31 | -9.9 |
|  28.90 | 15.2.80 | dots stretch into swirls | brush swish (synth) | -32 | -14.1 |
|  29.95 | 15.4.90 | bubble: 马奈的睡莲真美！ | pop_soft (1120) | -31 | -12.5 |
|  30.00 | 16.1.00 | punch-in on the blunder | air_quick (2605) | -32 | -12.9 |
|  30.40 | 16.1.80 | 踩雷 | dud (synth) | -24 | -8.2 |
|  30.40 | 16.1.80 | mine card lands | paper slide (1530) | -31 | -8.2 |
|  31.10 | 16.3.20 | MONET → MANET letter flip | card flick (2002) | -32 | +3.8 |
|  31.80 | 16.4.60 | white cube murmur | room tone (2981) | -37 | -3.9 |
|  32.00 | 17.1.00 | station → white cube | paint roller (synth) | -29 | -7.5 |
|  32.00 | 17.1.00 | whip-pan → white cube | whoosh_air (1489) | -27 | -7.5 |
|  32.60 | 17.2.20 | track lights click on | switch (2585) | -36 | -8.1 |
|  32.73 | 17.2.45 | track lights click on | switch (2585) | -37 | -13.8 |
|  32.85 | 17.2.70 | track lights click on | switch (2585) | -38 | -20.2 |
|  32.98 | 17.2.95 | track lights click on | switch (2585) | -39 | -27.0 |
|  33.50 | 17.4.00 | walk | footstep (heels, 542) | -33 | -17.7 |
|  33.80 | 17.4.60 | Fauve splash | brush swish (synth) | -30 | -18.8 |
|  34.00 | 18.1.00 | id card lands | paper slide (1530) | -31 | -17.2 |
|  34.20 | 18.1.40 | stamp №4 | paper (2001) | -32 | -14.3 |
|  34.20 | 18.1.40 | stamp №4 | stamp body (synth) | -26 | -14.3 |
|  35.30 | 18.3.60 | facets lock together | gear lock (2856) | -34 | -16.6 |
|  35.38 | 18.3.76 | facets lock together | gear lock (2856) | -34 | -16.5 |
|  35.46 | 18.3.92 | facets lock together | gear lock (2856) | -34 | -17.2 |
|  35.50 | 18.4.00 | walk | footstep (heels, 542) | -33 | -17.1 |
|  35.50 | 18.4.00 | id card lands | paper slide (1530) | -31 | -17.1 |
|  35.70 | 18.4.40 | stamp №5 | paper (2001) | -32 | -14.8 |
|  35.70 | 18.4.40 | stamp №5 | stamp body (synth) | -26 | -14.8 |
|  36.80 | 19.2.60 | Suprematist blocks drop | block thud (synth) | -32 | -12.0 |
|  36.90 | 19.2.80 | Suprematist blocks drop | block thud (synth) | -32 | -13.6 |
|  37.00 | 19.3.00 | Suprematist blocks drop | block thud (synth) | -32 | -13.1 |
|  37.00 | 19.3.00 | walk | footstep (heels, 542) | -33 | -13.1 |
|  37.00 | 19.3.00 | id card lands | paper slide (1530) | -31 | -13.1 |
|  38.50 | 20.2.00 | line card lands | paper slide (1530) | -31 | -14.7 |
|  38.60 | 20.2.20 | X-ray scan | scanner hum (synth) | -33 | -12.4 |
|  40.80 | 21.2.60 | Dada collage tears in | paper tear (synth) | -29 | -8.7 |
|  41.00 | 21.3.00 | walk | footstep (heels, 542) | -33 | -9.7 |
|  41.00 | 21.3.00 | id card lands | paper slide (1530) | -31 | -9.7 |
|  42.30 | 22.1.60 | colour bleeds in | air swell (synth) | -32 | -10.7 |
|  42.50 | 22.2.00 | walk | footstep (heels, 542) | -33 | -10.8 |
|  42.50 | 22.2.00 | move card lands | paper slide (1530) | -31 | -10.8 |
|  43.75 | 22.4.50 | steps into the colour | footstep (542) | -32 | -11.7 |
|  44.00 | 23.1.00 | steps into the colour | footstep (542) | -32 | -10.2 |
|  44.30 | 23.1.60 | Ben-Day dot wipe | pop_soft (1120) | -33 | -16.0 |
|  44.38 | 23.1.76 | Ben-Day dot wipe | pop_soft (1120) | -33 | -16.9 |
|  44.46 | 23.1.92 | Ben-Day dot wipe | pop_soft (1120) | -33 | -17.4 |
|  44.50 | 23.2.00 | id card lands | paper slide (1530) | -31 | -16.1 |
|  45.95 | 23.4.90 | bubble: 这我也能画。 | pop_soft (1120) | -31 | -0.9 |
|  46.00 | 24.1.00 | punch-in on the blunder | air_quick (2605) | -32 | +0.6 |
|  46.40 | 24.1.80 | 踩雷 | dud (synth) | -24 | -10.5 |
|  46.40 | 24.1.80 | mine card lands | paper slide (1530) | -31 | -10.5 |
|  47.80 | 24.4.60 | design hall murmur | room tone (2981) | -39 | -7.1 |
|  48.00 | 25.1.00 | whip-pan → design hall | whoosh_air (1489) | -27 | -8.7 |
|  48.05 | 25.1.10 | curtain-wall panels click in | gear fast lock tap (2857) | -34 | -10.2 |
|  48.15 | 25.1.30 | curtain-wall panels click in | gear fast lock tap (2857) | -34 | -10.1 |
|  48.25 | 25.1.50 | curtain-wall panels click in | gear fast lock tap (2857) | -35 | -12.2 |
|  48.35 | 25.1.70 | curtain-wall panels click in | gear fast lock tap (2857) | -35 | -14.0 |
|  48.45 | 25.1.90 | curtain-wall panels click in | gear fast lock tap (2857) | -36 | -15.1 |
|  48.55 | 25.2.10 | curtain-wall panels click in | gear fast lock tap (2857) | -36 | -14.3 |
|  48.65 | 25.2.30 | curtain-wall panels click in | gear fast lock tap (2857) | -36 | -13.5 |
|  48.75 | 25.2.50 | curtain-wall panels click in | gear fast lock tap (2857) | -37 | -13.4 |
|  49.00 | 25.3.00 | walk | footstep (heels, 542) | -33 | -17.3 |
|  49.50 | 25.4.00 | walk | footstep (heels, 542) | -34 | -16.2 |
|  49.80 | 25.4.60 | Nouveau whiplash | brush swish (synth) | -32 | -17.7 |
|  50.00 | 26.1.00 | id card lands | paper slide (1530) | -31 | -17.7 |
|  51.30 | 26.3.60 | Deco sunburst | brush swish (synth) | -33 | -14.4 |
|  51.50 | 26.4.00 | walk | footstep (heels, 542) | -33 | -14.7 |
|  51.50 | 26.4.00 | id card lands | paper slide (1530) | -31 | -14.7 |
|  52.80 | 27.2.60 | Bauhaus grid | gear fast lock tap (2857) | -35 | -12.2 |
|  52.88 | 27.2.76 | Bauhaus grid | gear fast lock tap (2857) | -35 | -12.8 |
|  52.96 | 27.2.92 | Bauhaus grid | gear fast lock tap (2857) | -35 | -13.1 |
|  53.00 | 27.3.00 | walk | footstep (heels, 542) | -33 | -12.4 |
|  53.00 | 27.3.00 | id card lands | paper slide (1530) | -31 | -12.4 |
|  53.04 | 27.3.08 | Bauhaus grid | gear fast lock tap (2857) | -35 | -12.4 |
|  54.50 | 28.2.00 | line card lands | paper slide (1530) | -31 | -12.0 |
|  57.00 | 29.3.00 | move card lands | paper slide (1530) | -31 | -15.4 |
|  57.20 | 29.3.40 | grid line drawn | pencil tick (2376) | -35 | -14.1 |
|  57.33 | 29.3.65 | grid line drawn | pencil tick (2376) | -35 | -19.2 |
|  57.45 | 29.3.90 | grid line drawn | pencil tick (2376) | -35 | -20.6 |
|  57.58 | 29.4.15 | grid line drawn | pencil tick (2376) | -35 | -20.2 |
|  57.70 | 29.4.40 | grid line drawn | pencil tick (2376) | -35 | -19.9 |
|  57.83 | 29.4.65 | grid line drawn | pencil tick (2376) | -35 | -20.3 |
|  57.95 | 29.4.90 | grid line drawn | pencil tick (2376) | -35 | -17.1 |
|  58.08 | 30.1.15 | grid line drawn | pencil tick (2376) | -35 | -13.0 |
|  58.30 | 30.1.60 | punch-in on the blunder | air_quick (2605) | -32 | -9.9 |
|  58.30 | 30.1.60 | bubble: 好“性冷淡风”啊。 | pop_soft (1120) | -31 | -9.9 |
|  58.75 | 30.2.50 | 踩雷 | dud (synth) | -24 | -10.2 |
|  58.75 | 30.2.50 | mine card lands | paper slide (1530) | -31 | -10.2 |
|  60.00 | 31.1.00 | 少即是多 appears | gear lock (2856) | -33 | -12.3 |
|  60.40 | 31.1.80 | 少即是无聊 sticker | card slap (2001) | -24 | -18.4 |
|  60.45 | 31.1.90 | pipes burst out | mechanical (3117) | -31 | -18.7 |
|  61.75 | 31.4.50 | whip begins | whoosh_air (1489) | -30 | -8.8 |
|  62.00 | 32.1.00 | white cube murmur | room tone (2981) | -37 | -12.9 |
|  62.00 | 32.1.00 | whip-pan → black square | whoosh_air (1489) | -27 | -12.9 |
|  62.50 | 32.2.00 | bubble: 所以…… | pop_soft (1120) | -31 | -16.8 |
|  64.00 | 33.1.00 | he steps closer, calm | footstep (542) | -31 | -20.0 |
|  64.25 | 33.1.50 | bubble: 它底下， | pop_soft (1120) | -31 | -18.5 |
|  65.00 | 33.3.00 | bubble: 哇。 | pop_soft (1120) | -33 | -22.2 |
|  65.40 | 33.3.80 | passer-by crosses the foreground | footstep (heels, 542) | -30 | -15.3 |
|  65.60 | 33.4.20 | bubble: 这我也能画。 | pop_soft (1120) | -31 | -16.0 |
|  65.90 | 33.4.80 | passer-by crosses the foreground | footstep (heels, 542) | -32 | -17.0 |
|  66.40 | 34.1.80 | passer-by crosses the foreground | footstep (heels, 542) | -30 | -11.2 |
|  66.85 | 34.2.70 | bubble: 但你没有。 | pop_soft (1120) | -31 | -22.7 |
|  66.90 | 34.2.80 | passer-by crosses the foreground | footstep (heels, 542) | -32 | -23.3 |
|  67.60 | 34.4.20 | push into the black square | air swell (synth) | -31 | -17.6 |
|  68.00 | 35.1.00 | CLINK — final downbeat | wine-glass clink (2936) | -19 | -12.7 |
