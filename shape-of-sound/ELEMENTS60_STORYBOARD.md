# 元素周期表 = 宇宙的配料表 — 60-second cut

16:9 · 1920×1080 · 30 fps · **60 s** (120 BPM, 30 bars of 2 s) · Remotion composition `Elements60` (`src/elements60/`)
Timeline, camera keys and colour fields: `src/elements60/e60.json`. Per-element data (state at 25 °C, melting point,
abundance size, rain / glissando / year / origin times, the body's dots): `src/elements60/t60.json`, written by
`music/elements60_data.py` from `src/elements/table.json` and PubChem's periodic table (`music/data/pubchem_periodic_table.csv`).
Score and sound design: `music/elements60.py` (reads both files; cue sheet in `out/elements60_cues.md`).

## Why a new cut
The 192-s film was "too slow, too little information, not as fun as 声音的形状". This cut follows the density rule in
`.claude/skills/video-craft/narrative.md`: a new visual idea every 2–3 s, labels instead of sentences, numbers shown as
geometry, every event with a sound.

## The idea: the periodic table is the universe's ingredient list
A food label (配料表) opens the film and closes it. In between, the same 118 tiles are re-coloured, lifted, resized and
re-arranged; the table is the stage and never leaves the screen.

## Beats
| t (s) | Beat | Picture | Sound |
|---|---|---|---|
| 0–2 | **Hook** | Frame 1: a white food label slams onto a pink field: 配料表 · 氧 65%. The rows tick in (碳 18.5 · 氢 9.5 · 氮 2.6 · 钙 1.3 · 磷 0.6) | the slam; each row plays the theme's next note (E G C B A G) |
| 2–3 | Reveal | the camera pulls back: the label is printed on a person. 「这是你的配料表」 · 你 65% 是氧 | brass "ta-da" |
| 3–5 | Three more labels | whip-pans, one per beat-and-a-half: 空气 (N₂ dumbbells: 氮 78 / 氧 21 / 氩 0.9, by volume), 太阳 (氢 73 / 氦 25), 大地 (地壳: 氧 46 / 硅 28 / 铝 8 / 铁 5) | stabs on Am, F, G |
| 5–8 | One table | 「万物的配料，都在这张表上」: 118 tiles slam down in a diagonal wave; 「只有 118 种」; title tiles 元素周期表 = 宇宙的配料表 | a 118-note glissando over a G pedal; a hit; the theme's head |
| 8–10 | 01 怎么读 | 编号 = 质子数: a nucleus widget counts 1, 2, 3 (H, He, Li), then races to 118 as the tiles light in order | the scale; a rush |
| 10–12 | | 第几行 = 几层电子: seven shells ring out around the nucleus as the seven rows light | harp, one note per shell |
| 12–14 | | 同一列 = 同一种脾气: in isometric, column 1 rises red (外层 1 个电子 → 超活泼), column 18 rises pink (外层满了 → 超淡定) | low brass; choir |
| 14–18 | | **The period, audible**: each row plays on one beat, a playhead runs along it, every element is a note (pitch = column), each row ends on a noble-gas accent. 「这就是「周期」」 | seven rising runs on seven beats |
| 18–21 | 02 反常识 1/9 | tiles flip like a card stunt to states at 25 °C: 11 gases float up, the 2 liquids melt into puddles: 「只有 2 个：汞、溴」; 镓 29.8 °C · 握在手里就化 | bloops up, a slide down |
| 21–23.5 | 2/9 | 熔点 = 高度: isometric towers coloured from cold blue to white-hot; tungsten 3422 °C (熔点最高的金属 → 灯丝) | a swell; a clank |
| 23.5–26 | 3/9 | the tiles lift away and drop back by discovery year: 古人只认识 9 种 → 1669 磷，从尿里炼出 → 1869 已知 63 种 | every landing a note |
| 26–30 | 4/9 | Mendeleev's three "?" gaps: 「故意留了 3 个空格」「还预言了它们长什么样」; Ga 1875 ✓ Sc 1879 ✓ Ge 1886 ✓; 「全中！」; the rest rush in to 2016 | the theme with its peak missing; the found elements play the missing notes |
| 30–32.5 | 5/9 | tiles resized by abundance: hydrogen fills the screen. 宇宙里的原子 92% 都是氢 (by number of atoms; sizes illustrative) | a sub swell; a hit |
| 32.5–34.5 | 6/9 | 稀土：不稀，也不是土: the lanthanides rise; Ce and Cu rise to the same height: 地壳里一样多 | two equal notes |
| 34.5–37 | 7/9 | YTTERBY: the village's letters light yellow as Y, Tb, Er, Yb light, lines drop to their tiles: 1 个村 → 4 种元素 | four plucks |
| 37–39 | 8/9 | 氦：先在太阳上被发现: the Sun, its spectrum, 1868: 一条认不出的黄线; the line becomes the He tile and flies to its square: 27 年后，地球上才找到 | a held high note; the flight |
| 39–41 | 9/9 | 93 号以后：几乎全靠人造: 26 tiles turn chrome; a ring accelerator counts to 26 | synthetic plucks; the build |
| 41–50 | 03 产地 | night; the table goes dark in a wave; each origin gets a big diagram and lights its tiles: 宇宙大爆炸 → 氢、氦; 恒星内部 (onion shells H He C O Si Fe) → 碳、氮、氧; 恒星爆炸 → 氧、硅、铁; two neutron stars spiral in and merge → 金、铂、铀; 实验室. Legend, 简化示意 | no drums: strings, choir, horns on the theme; the Big Bang; a gravitational-wave chirp (f ∝ (t꜀−t)^−3/8); the merger lands on F |
| 50–54 | Ending | the 118 tiles fly into the same figure as the opening, as dots coloured by where your atoms were made (H 62 %, O 24 %, C 12 % of your atoms); the label returns with origin tags (← 大爆炸 / 恒星 / 恒星爆炸) and a red stamp: 生产日期：早于地球 | the theme's second phrase, building |
| 54–56.3 | Lift | pull out to the stars: 「你体内的氢，和宇宙一样老。」「其余的原子，来自星星。」 | F → **F minor** on the line, home to C |
| 56.3–58.2 | Breath | back to the table on paper; an empty row 8, 119 and 120 blink "?": 「配料表，还没写完。」 | solo piano: the theme's head with its peak still missing |
| 58.2–60 | End card | yellow; the label once more: 元素周期表 · 配料 118 种（未完待续）· 产地 宇宙 · 生产日期 138 亿年前起 | C add 9: home, one note left open |

Transitions: every lens change is a colour-field sweep plus a card-stunt flip or lift of the same tiles; the opening's
labels whip-pan; the hook hands over by zooming through the title; the ending morphs the tiles into the body and back.

## Facts and sources
| On screen | Source / note |
|---|---|
| Body by mass: O 65, C 18.5, H 9.5, N 2.6, Ca 1.3, P 0.6 %; by atoms H 62, O 24, C 12 % | Wikipedia "Composition of the human body" (table); shown as 约数 |
| Air by volume: N₂ 78, O₂ 21, Ar 0.9 % | standard data |
| Sun by mass: H ≈ 73 %, He ≈ 25 %, others ≈ 2 % | OpenStax Astronomy 15.1 |
| Earth's crust by mass: O 46, Si 28, Al 8, Fe 5 % | standard data (CRC / Wikipedia "Abundance of elements in Earth's crust") |
| 118 elements; atomic number = protons; row = electron shell; column = same outer electrons | standard chemistry |
| Only Br and Hg are liquid at 25 °C; 11 elements are gases (H N O F Cl He Ne Ar Kr Xe Rn) | PubChem periodic table (StandardState); the superheavies 104–118 are left grey (unknown) |
| Ga melts at 29.76 °C | Wikipedia "Gallium" |
| W melts at 3422 °C (3695 K), the highest of the metals | PubChem; carbon's tower is taller (it sublimes), so the label says 金属 |
| 9 elements known in antiquity (C S Fe Cu Ag Sn Au Hg Pb); P from urine, Brand 1669; 63 known by 1869 | element histories (as in the long film) |
| Mendeleev left gaps and predicted eka-aluminium, eka-boron, eka-silicon; Ga 1875, Sc 1879, Ge 1886 | Wikipedia "Mendeleev's predicted elements" |
| ~92 % of the atoms in the universe are hydrogen (He/H ≈ 0.085 by number) | Asplund et al. 2009 solar abundances; tile sizes illustrative (示意) |
| Rare earths are neither rare nor earths; Ce is about as abundant in the crust as Cu (~60 ppm) | USGS; standard data |
| Ytterby gave its name to Y, Tb, Er, Yb | Wikipedia "Ytterby" |
| He: a yellow line in the solar spectrum (1868 eclipse), found on Earth 1895 (27 years) | Wikipedia "Helium" |
| From 93 on, essentially all are made in labs (Np and Pu also occur in traces, hence 几乎) | standard data |
| H and He from the Big Bang; C, N, O … in stars; O, Si, Fe … in stellar explosions; much of the gold, platinum, uranium in neutron-star mergers | Johnson, "Populating the periodic table" (Science 2019); labelled 简化示意 |
| 「你体内的氢，和宇宙一样老」 | hydrogen nuclei formed in the first minutes after the Big Bang, 13.8 billion years ago |
| 生产日期：早于地球 | the atoms in a body formed before the Solar System (4.6 billion years ago) |

## Music
One theme (the same 8 bars as the long film), re-orchestrated for each act: the label's rows play its first six notes;
the title its head; the gaps lens plays the head with the peak missing and the found elements play the missing notes;
the cosmos plays the first phrase on strings and choir; the ending the second phrase with the minor iv on the most
human line, then the head with its peak still missing, and C add 9. Sound effects: ~13 dB under the music (median),
no bells or chimes; master −16.2 LUFS. A sound-effects-only mix is written to `out/elements60_sfx_only.wav`.
