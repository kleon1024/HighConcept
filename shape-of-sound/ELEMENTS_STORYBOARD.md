# 一次看懂元素周期表 — storyboard

16:9 · 1920×1080 · 30 fps · **192 s** (120 BPM, 2-s bars) · Remotion composition `Elements` (`src/elements/`)
Timeline, captions, camera keys and cues: `src/elements/elements.json`. The 118 elements (positions, families, discovery
years, cosmic origins, roll-call and appear times): `src/elements/table.json`, written by `music/elements_data.py`.
Score and sound design: `music/elements.py` (reads both files, so every sound sits on the frame of its event).

## Idea: one table, four lenses
118 elements are too many to walk through one by one, so the film shows the **whole table four times**, each time in a
different light, and lets a few stars carry the stories:

| Lens | Question | What every tile does |
|---|---|---|
| 1 拼图 | 人类是怎么拼出这张表的？ | drops in the year it was found (ancient → 2016), with a year counter |
| 2 读懂这张表 | 它按什么规则排？ | protons count up, rows become electron shells, the table unfolds to 32 columns, then **plays itself** as music |
| 3 元素街坊 | 它们各是什么脾气？ | each family rises as a district, with one everyday object per district |
| 4 从哪里来 | 它们是从哪来的？ | the table goes dark and lights up by cosmic origin |

**Look:** a 2.5D isometric "element city" in bold superflat colours on cream paper (blocks with lit tops and shaded sides),
sticker captions with hard ink shadows, and a navy night sky for the cosmic chapter. The camera tilts between a flat table,
an oblique view and true isometric, flying district to district.

## Beats
| t (s) | Beat | Picture | Sound |
|---|---|---|---|
| 0–14 | **Hook** | Hot pink: a superflat hand holds a chrome cube of gallium; it melts in the palm and drips through the fingers (「这块金属，会在你手心里融化。」, sticker: 熔点只有 29.8°C). Cut to black: a dashed "?" tile; 「1871 年，还没人见过它，有人已经写出了它的样子：」 — Mendeleev's predictions type out (原子量 ≈ 68 · 密度 ≈ 6 · 熔点很低). The tile flips to Ga: 「1875 年，它被找到了——」, the real values tick ✓ ✓ ✓ (69.7 · 5.9 · 29.8°C). Yellow: 「几乎全中！」「他从没见过它，」「他是怎么知道的？」, and the tile flies into the empty table | a playful A-minor groove with a sliding melt; a drone and a clock at the cut; the three ✓ play E and G, and the slam completes the motif on C; then the theme's first bar with its top note missing |
| 14–18 | Title | the five title characters drop in as element tiles: 「一次看懂元素周期表 · 一张能预言未来的表」 | the leitmotif on marimba with the band |
| 18–31 | Lens 1 | tiles drop in by discovery year; ancient 9 → 1669 phosphorus (from urine) → 63 by 1869 | every tile that lands plays a marimba note |
| 31–37 | Newlands | a keyboard: Li Be B C N O F Na = do … do; Li and Na match; 「你怎么不按字母排？」 | the octave; the room laughs; a soft sad trombone |
| 37–45 | Mendeleev | the known tiles lift into a deck of cards and are laid back in order; three gaps glow "?"; his predictions (类铝 5.9, 类硼 44, 类硅 72) | parlour piano; the clarinet theme with **three notes missing** |
| 45–50 | The gaps fill | Ga 1875 (Gallia), Sc 1879 (Scandia), Ge 1886 (Germania): 「名字，都是国名。」 | each missing note is played in |
| 50–56 | To 118 | the noble-gas column appears whole; the 20th century rushes to 2016 | hats in sixteenths, synth plucks, choir; arrival hit |
| 56–82 | Lens 2 | iso camera; one proton per step (nucleus widget, H→O, then to 118); electrons fill shells; rows = shells; column 1 rises (one outer electron); the table unfolds to 32 columns and folds back; s/p/d/f blocks | a scale for the protons; a harp for the electrons; the same motif in three octaves for Li/Na/K |
| 83–104 | **Roll call** | all 118 tiles light up in order, a ticker shows each one | each element is a note; pitch = column, so every row is a rising run that lands on a noble-gas chord and starts over: you *hear* the period |
| 104–158 | Lens 3 | districts rise one by one with an illustration card: H (90 % of atoms) · alkali (Na + water 砰！, Li battery) · alkaline earth (Ca bone, Sr/Ba fireworks) · transition metals (Fe, Cu, Au, W 3422 °C, Hg) · rare earths (not rare, not earth; Nd magnets) · C/Si/N/O (diamond = pencil, sand → chip, air 78/21) · halogens (snatch an electron; salt, toothpaste) · noble gases (NEON; He found in the Sun) · actinides (U, Am in smoke detectors, made in accelerators) | the band; the theme re-voiced per district; matching effects |
| 158–178 | Lens 4 | night; the Big Bang lights H/He; stars light C–Fe (「你血液里的铁，来自一颗早已死去的恒星。」); two neutron stars spiral in and collide: gold and platinum; the rest are human-made; 「你身上几乎每个原子，都比地球还老。」 | pads, strings, choir; a real inspiral **chirp** (f ∝ (t꜀−t)^−3/8) |
| 178–192 | Ending | back to paper; an empty row 8 appears, 119 and 120 blink "?"; 「门捷列夫留下的空格——今天还在。」; end card: the title tiles plus an empty "?" tile, 「下一个空格，也许等你来填。」 | solo piano; the theme with a gap; a warm final C |

## Music: a melody with notes missing
The periodic table began as a pattern with holes in it, so the score is one 8-bar theme in C major
(I – V⁶ – vi – IV | ii⁷ – iii⁷ – IV – **iv** – I) that is only heard whole once the table is whole
(`music/elements_score.py`):

| Where | What the theme does | Why |
|---|---|---|
| Cold open | an A-minor pizzicato ostinato and a clock; the 5.9 slam lands on **C**, the theme's home chord; then the theme's first bar with its top note missing | a question with a hole in it |
| Title | the first phrase, whole and warm (piano, strings) | the promise |
| History | a light discovery groove; every tile that lands plays a note | finding things is fun |
| Mendeleev | the first phrase on clarinet with **three notes left out** (the theme's three peaks) | his three blanks |
| The gaps fill | gallium, scandium and germanium each play back **the exact missing note** | the prediction comes true, audibly |
| Roll call | all 118 elements as running notes (pitch = column: each row rises and starts over), and above them, **for the first time, the whole theme** on strings, horn and piano | every piece in its place |
| Neighbourhoods | the band, light; the theme passed from flute to horn to marimba to bassoon… one voice per district | each family has its own voice |
| Cosmos | no drums: strings, horns, choir; the second phrase arrives with the neutron-star merger, turns to **F minor** on 「你身上几乎每个原子，都比地球还老」 and resolves to C as the film comes home | the emotional peak: we are made of this |
| Ending | solo piano; the theme with its peak still missing at 「门捷列夫留下的空格」; the last chord resolves but keeps one note open (C add 9) | the next empty square is yours |

Sound effects (`music/elements.py`): ceramic tile knocks for every tile, paper and cards for Mendeleev, a laugh for
Newlands, sodium's splash and 砰, fireworks, a phone buzzing, a neon hum, the Big Bang, and a synthesised inspiral chirp
(f ∝ (t꜀−t)^−3/8). All soft, about 15 dB under the music (median); master −16.2 LUFS. A sound-effects-only version is
written to `out/elements_sfx_only.wav` for posting with a platform track.

## Facts and sources
| On screen | Source / note |
|---|---|
| Gallium melts at 29.76 °C (so it melts in a hand); Mendeleev predicted eka-aluminium in 1871 (atomic weight 68, density 6.0, low melting point); Lecoq de Boisbaudran found gallium in 1875 (69.72, 5.91 g/cm³, 29.76 °C) | Wikipedia "Gallium", "Mendeleev's predicted elements" (comparison table) |
| Gallium < Gallia (France); scandium < Scandia (Nilson, 1879); germanium < Germania (Winkler, 1886) | Wikipedia "Mendeleev's predicted elements"; element articles |
| About 63 elements were known by 1869; Mendeleev ordered them by atomic weight and properties and left gaps; predictions: eka-aluminium (density ≈ 5.9), eka-boron (atomic weight ≈ 44), eka-silicon (≈ 72) | Wikipedia "Mendeleev's predicted elements"; the card story is popular lore, marked 「据说」 |
| Newlands' law of octaves (1865) was mocked at the Chemical Society: why not order them alphabetically? | Wikipedia "John Newlands" |
| Phosphorus was isolated from urine by Hennig Brand, 1669 | Wikipedia "Phosphorus" |
| The noble gases (Ar 1894, He 1895 on Earth, Ne/Kr/Xe 1898) needed a whole new column | Wikipedia "Noble gas" |
| Elements 113, 115, 117, 118 were named in 2016 | IUPAC, Nov 2016 |
| Atomic number = protons; a period = an electron shell being filled; a group = the same outer electrons → similar chemistry | standard chemistry |
| Hydrogen is ~90 % of the atoms in the universe | ~92 % by number (NASA / standard astronomy); shown as "约九成" |
| Alkali metals react violently with water; Li-ion batteries; Ca in bone; Sr red and Ba green in fireworks | standard chemistry |
| Tungsten melts at 3422 °C (highest of the metals); mercury is liquid at room temperature; gold does not corrode | standard data |
| Rare earths are neither rare nor earths (Ce is about as abundant as Cu); Nd–Fe–B magnets in phone vibration motors and earphone speakers | USGS; standard materials science |
| Diamond and graphite are both carbon; silicon chips start from sand (SiO₂); air is ~78 % N₂, ~21 % O₂ | standard data |
| Chlorine in table salt; fluoride in toothpaste; neon signs; helium was found in the solar spectrum (1868 eclipse) before on Earth (1895) | Wikipedia "Helium" |
| Uranium fuels reactors; americium-241 is in ionisation smoke detectors; from 93 on, essentially all are made in labs (Np and Pu exist in trace amounts in nature, hence 「几乎」) | standard data |
| H and He from the Big Bang; heavier elements forged in stars and stellar explosions; much of the gold attributed to neutron-star mergers (GW170817, 2017) | Johnson, "Populating the periodic table" (Science 2019) / her origin chart; LIGO–Virgo 2017. The origin colours are a **simplified** main channel per element, labelled 简化示意 |
| "Almost every atom in your body is older than the Earth" | they formed before the Solar System; hedged with 「几乎」 |
| 119 and 120 are being sought now | RIKEN (119); LBNL 2024 (Ti-50 beam, a step toward 120) |

The Chinese names of 104–118 are not drawn on the tiles: the font in this project cannot render those characters.

## Media
- `public/media/el_lecoq.jpg` — Lecoq de Boisbaudran, public domain (Wikimedia Commons)
- `public/media/el_mendeleev.jpg` — Mendeleev, 1897, public domain (Wikimedia Commons)
- Everything else is drawn in code.
