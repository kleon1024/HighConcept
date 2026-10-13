# 提灯的人 — 60 秒，一条线看懂西方哲学

16:9 · 1920×1080 · 30 fps · **60 s** (120 BPM, 30 bars of 2 s) · Remotion composition `Philo` (`src/philo/`)
Timing, iris carry points and every cue: `src/philo/philo.json` (shared with the score). Score and sound design:
`music/philo.py` (cue sheet in `out/philo_cues.md`).

## The idea
One object carries 2400 years: **a lamp**. Diogenes walks through the market at noon with a lit lamp, "looking for a
human". About 2200 years later Nietzsche's madman runs into the morning market with a lantern, looking for God. In 1984
Foucault's last lectures were about Diogenes. The question underneath every school: **怎样活，才算一个「人」？**
The takeaway is the contrast the user asked about: 古典犬儒 *see through it and live honestly*; 现代犬儒 *see through it
and go along anyway*. The last line hands the lamp to the viewer: 「看透之后——你点灯，还是熄灯？」

## Design system
- Light and shadow: flat cut-paper silhouettes, one warm light source (the flame) in every scene, dust in the light.
- One colour field per school: Greek terracotta with a black-figure meander (古典), sunlit paper (犬儒), blueprint navy
  with a grid (功利, the engineer's era), violet night (叔本华), blood red (虚无), Paris charcoal (存在), surveillance
  black and cyan (福柯), phone-screen navy and pink (现代犬儒).
- Thinkers reduced to the one feature everyone knows: Socrates' beard, Diogenes' lamp, Bentham in his glass case,
  Schopenhauer's white tufts, Nietzsche's moustache, Sartre's glasses and pipe, Foucault's bald head and turtleneck.
- Type: Noto Serif SC 900 for the lines, Cormorant Garamond for Latin names and the Roman numerals I–VIII.
- The ruler along the bottom: 2400 years with a break for the quiet 2000; the lamp flame is the playhead and flies to
  each school's year on its downbeat; every visited school stays lit.
- **Signature transition: the iris of light.** Each scene opens out of a circle carried over from the last one: the
  title lamp → Greece; Plato's sun → Diogenes' noon; the ruler's playhead → 1789; the Panopticon's tower →
  Schopenhauer; the pendulum's bob → Nietzsche; the drifting sun → Paris; Sisyphus' stone at the top → the
  Panopticon; the 1984 lamp → today; the split-screen seam → the map.
- Every shot has a slow push-in; content enters during the iris so no frame is empty.

## Beats
| t (s) | Section | Picture | Music | Sound |
|---|---|---|---|---|
| 0–6 | Hook | a match strikes in the dark: a lamp. Pull back: noon, a market, a ragged man with a lit lamp. 「大白天，他提着灯上街。」「你在找什么？」「找一个人。」 第欧根尼 · 公元前 4 世纪 · 雅典. The camera dives into the flame | a drone; the lamp motif on a lyre (A D E F E D C A); the aulos echoes it | match, flame, market murmur, the dive |
| 6–8 | Title | 提灯的人 under the lamp; the ruler appears | D minor swells, harp sweep, the motif's head on horn | hit, flame |
| 8–14 | **I 古典** | Socrates' bust: 「未经审视的人生，不值得过。」 (399 BC, hemlock). Plato's cave: shadows on the wall, one prisoner turns and walks out to the sun: 「你看到的，可能只是影子」. Aristotle's mean: 怯懦 — 勇敢 — 鲁莽, the marker settles in the middle. 古典的答案：理性 → 美德 → 幸福 | lyre and aulos over a frame drum (D Dorian); a flash of D major for the sun; the mean as notes converging from both extremes | cave air, a bright swell, wood ticks |
| 14–20 | **II 古典犬儒** | the lineage 苏格拉底 → 安提斯泰尼 → 第欧根尼; 犬儒 = 像狗一样活 (kyōn = dog); he lives in a jar; throws away his bowl after seeing a child drink from his hands; Alexander's shadow covers the sun: 「我能为你做点什么？」「别挡住我的阳光。」; the light returns. 古典犬儒：看穿虚伪的规矩，按本性真活 | pizzicato and a bassoon "woof"; a pompous fanfare for Alexander; one deadpan lyre note for the reply | pencil, a hollow knock, the bowl's clink, footsteps |
| 20–26 | **III 功利** | the playhead flies 2000 years to 1789. Bentham: 最大多数人的最大幸福 — a field of people, each a + or −, summed. Mill's scale: 宁做不满足的苏格拉底，不做满足的猪 (Socrates' side sinks). Bentham's body in a glass case at UCL; he also drew a prison: the Panopticon (1791) | harpsichord Alberti bass and strings (the classical era); a minuet that turns ominous on the prison plan | typewriter clicks, a wooden clunk, glass, pencil |
| 26–32 | **IV 叔本华** | 1818: under the neat world of 表象, a blind churning 意志 pushes up. 人生像钟摆，在痛苦和无聊之间摆. Sticker: he scheduled his lectures against Hegel's — five students came. 出路：艺术、同情、少欲 | Wagner's Tristan chord (Wagner revered Schopenhauer); Romantic piano and cellos; the pendulum as a ticking left hand; B♭ for art's consolation | heartbeat, a low rumble, clock ticks |
| 32–38 | **V 虚无** | 1865: a student buys Schopenhauer's book in a Leipzig second-hand shop — Nietzsche. Another man with a lamp in the morning market: 「我在找上帝！」 **上帝死了。** The earth comes loose from its sun. The blocks 上帝 / 真理 / 道德 / 意义 fall: 最高的价值，自己贬值了. 尼采：那就自己创造价值 | church organ plays the motif; a sunrise fanfare (root, fifth, octave — a nod to Strauss's *Zarathustra*) whose D major turns D minor; a dissonant cluster; trumpets climb | page turn, murmur, thunder, stones |
| 38–44 | **VI 存在** | 1945, Paris. A paper-knife: designed first, then made. A person: exists first (a dot), then draws their own outline: **存在先于本质**; 「人是被判定为自由的」. Camus: Sisyphus pushes the stone up, it rolls back: 应当想象西西弗是幸福的 | Left Bank jazz: brushes, walking bass, a muted trumpet with a blue note; Sisyphus as a bass line climbing and tumbling; a D major 7 for "happy" | typing, a pop, pencil, stone rumble and slide |
| 44–50 | **VII 福柯** | 1975: Bentham's prison becomes the plan of modern society; the tower's beam sweeps; the light goes off and the prisoners still keep still: 不知道有没有人在看——于是自己管住自己. The cells unroll into a grid: 学校 · 军营 · 工厂 · 医院 · 屏幕. 1984: his last course was about — **第欧根尼** (《说真话的勇气》) | cold synths: pulse, arpeggio; the tower goes dark and only the pulse remains; the lyre returns for Diogenes | scanner, a light switch, shutters, the match again |
| 50–54 | **VIII 现代犬儒** | 「可今天说的「犬儒」，变了味」: on a sofa, lit by a phone: **什么都看透，照样配合。** (Sloterdijk 1983: 开明的虚假意识). Split screen: 古典犬儒 看透了 → 真活 (lamp lit) / 现代犬儒 看透了 → 算了 (lamp cold) | lo-fi half-time; at the split, the lyre plays on the left speaker and the lo-fi keys on the right | vinyl crackle, a sofa flop, the left lamp burns, the right lamp clicks off |
| 54–56 | The map | the whole line on one screen: 11 thinkers and their links (师承, 旧书店, 上帝死后, 全景监狱, 1984 最后一课, 名字被借走); 「2400 年，同一个问题：怎样活，才算一个「人」？」 | the motif on full orchestra and choir | soft clinks as each link lights |
| 56–58.6 | The lamp | back to the noon street; Diogenes lifts the lamp toward us: 「我在找一个人。」 → 「看透之后——你点灯，还是熄灯？」 | a hush: the aulos asks the motif; B♭ … C … | murmur, the flame close |
| 58.6–60 | End | the world goes dark; only the flame is left: 提灯的人 | **D major**: the lamp is lit | the last flame |

## Facts and sources
| On screen | Source / note |
|---|---|
| Diogenes lit a lamp in daylight, "looking for a human"; lived in a large jar (pithos); threw away his cup/bowl after seeing a child drink from his hands; told Alexander "stand out of my sun" | Diogenes Laërtius, *Lives* VI (41, 37, 38); Plutarch, *Alexander* 14 |
| Cynic < Greek *kynikos* "dog-like" (*kyōn* = dog); Antisthenes, a pupil of Socrates, is traditionally the founder and Diogenes his pupil | standard; the pupil link is tradition |
| 「未经审视的人生，不值得过」; Socrates sentenced to death in 399 BC (corrupting the youth, impiety), by hemlock | Plato, *Apology* 38a; *Phaedo* |
| The cave: prisoners see shadows; the one who leaves sees the sun (the Good) | Plato, *Republic* VII |
| Courage is the mean between cowardice and rashness | Aristotle, *Nicomachean Ethics* II–III |
| "The greatest happiness of the greatest number"; the felicific calculus (1789); the Panopticon (1791) | Bentham, *A Fragment on Government* (1776), *An Introduction to the Principles of Morals and Legislation* (1789), *Panopticon* (1791) |
| Bentham's preserved body (the auto-icon) is displayed at University College London | UCL |
| "Better to be Socrates dissatisfied than a fool satisfied" (and a human dissatisfied than a pig satisfied) | Mill, *Utilitarianism* (1863), ch. 2 |
| *The World as Will and Representation* (1818/19): the will beneath representation; life swings like a pendulum between pain and boredom | Schopenhauer, WWR I §57 |
| He scheduled his Berlin lectures (1820) at the same hour as Hegel's; about five students came | Hübscher (1958); standard biographies |
| Nietzsche found WWR in a Leipzig second-hand bookshop in 1865 | Nietzsche's own retrospective of his Leipzig years |
| The madman lights a lantern in the bright morning: "I seek God!"; "God is dead … we have killed him"; "unchained this earth from its sun" (1882) | Nietzsche, *The Gay Science* §125 |
| Nihilism: the highest values devalue themselves | Nietzsche's notebooks (*The Will to Power* §2) |
| Existence precedes essence; the paper-knife example; "condemned to be free" (lecture of 29 Oct 1945) | Sartre, *Existentialism Is a Humanism* (1946) |
| "One must imagine Sisyphus happy" | Camus, *The Myth of Sisyphus* (1942) |
| The Panopticon as the diagram of disciplinary power; visibility as a trap; schools, barracks, factories, hospitals | Foucault, *Discipline and Punish* (1975) |
| His last Collège de France course (Feb–Mar 1984), *The Courage of Truth*, was largely on the Cynics; he died 25 June 1984 | Collège de France lectures; Harcourt, "Introducing The Courage of Truth" |
| Modern cynicism as "enlightened false consciousness", contrasted with ancient *Kynismus* | Sloterdijk, *Critique of Cynical Reason* (1983) |

## Music
One motif (A D E F E D C A in D Dorian, "searching") through every era's sound: lyre and aulos; pizzicato and bassoon;
harpsichord; Romantic piano with the Tristan chord; organ and a *Zarathustra*-style fanfare whose major turns minor;
Left Bank jazz with a muted trumpet; cold synths; lo-fi; full orchestra. The film is in D minor and its last chord is
D major: the lamp is lit. Sound effects sit under the music (see the cue sheet), no bells or chimes; master −16 LUFS.
