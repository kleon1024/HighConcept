// The hero: an original masked reveller in a black haori, drawn as a P5-style ink cut-out.
// Noir cel lighting from the upper-left: only the far side of the face is lit; the near eye glows red in shadow.
// Local coordinates: origin = between the eyes, head turned 3/4 toward the viewer's left. Units = px at scale 1.
(function (root) {
  const { C, P, poly, strand, strand2, dots, f1 } = root.P5K;

  const FACE = 'M-150,-120 C-170,-70 -178,-24 -168,8 C-163,26 -172,46 -178,72 C-180,112 -162,162 -130,206 C-106,240 -84,264 -58,280 L-44,286 C2,266 72,228 118,178 C140,152 152,120 158,80 L164,-120 Z';
  const SHADOW = 'M-36,-120 L164,-120 L158,80 C152,120 140,152 118,178 C72,228 2,266 -44,286 L-50,262 C-40,236 -30,214 -44,196 C-60,176 -56,150 -40,140 C-60,130 -76,118 -86,104 C-70,96 -66,80 -72,60 C-80,30 -70,0 -50,-30 C-44,-60 -40,-90 -36,-120 Z';
  const SKULL = 'M-178,40 C-210,-40 -230,-140 -200,-220 C-160,-290 -60,-320 40,-312 C150,-300 240,-250 270,-170 C300,-100 290,-20 260,40 C240,80 220,110 200,130 L170,60 L166,-96 L-150,-96 Z';
  const BANGS = [
    [-186, -120, -200, 56, 70, -10, 8], [-130, -130, -150, 10, 80, -8, 10], [-66, -140, -40, 64, 86, 12, -10], [4, -140, 40, -26, 80, 8, -4],
    [80, -136, 130, 0, 76, 10, -6], [148, -120, 200, 70, 66, 10, -8], [200, -90, 240, 170, 62, 12, -10],
  ];
  const LOCKS = [
    // top contour: big locks sweeping back, tips up-right
    [-210, -150, -110, -380, 110, -34, 30], [-90, -240, 70, -436, 124, -30, 22], [30, -250, 250, -404, 124, -22, 22], [140, -210, 376, -280, 130, -12, 24],
    // back: wave-like locks streaming right
    [200, -150, 410, -150, 130, -16, 26], [226, -50, 400, 30, 116, -14, 22], [206, 50, 330, 190, 84, -10, 14],
    // front flick toward the mask
    [-190, -210, -312, -262, 70, 12, -10],
  ];
  const SEPS = [ // black separations that cut the highlight into locks
    [-176, -150, -100, -340, 18, -12, 10], [-70, -230, 46, -400, 18, -12, 8], [50, -240, 214, -370, 18, -8, 8], [150, -200, 330, -280, 16, -8, 8],
  ];
  const INNER = [ // dark-grey flow lines inside the mass
    [-150, -230, -130, -70, 10, 8, -4], [200, -250, 180, -50, 10, -6, 4], [230, -130, 420, -150, 8, -6, 8], [230, -40, 410, 0, 8, -6, 8], [150, -260, 360, -290, 8, -8, 8],
  ];

  function hair() {
    let s = `<path d="${SKULL}" fill="${C.K}"/>`;
    BANGS.concat(LOCKS).forEach((a) => { s += `<path d="${strand2(...a)}" fill="${C.K}"/>`; });
    return s;
  }

  function head() {
    let s = '';
    // neck (black) with a grey throat plane
    s += poly([[-40, 236], [112, 196], [140, 400], [-12, 428]], C.K);
    s += poly([[-30, 300], [20, 286], [10, 420], [-12, 428]], C.G3);
    // face: lit white base, then the shadow mass
    s += `<path d="${FACE}" fill="${C.W}"/>`;
    s += `<path d="${SHADOW}" fill="${C.K}"/>`;
    // far brow + eye (lit, ink)
    s += poly([[-172, -56], [-128, -74], [-82, -72], [-126, -60]], C.K);
    const eyeF = [[-160, 0], [-142, -18], [-104, -24], [-74, -14], [-84, 12], [-132, 18]];
    s += `<clipPath id="eyeF"><path d="${P(eyeF)}"/></clipPath><g clip-path="url(#eyeF)">` +
      `<ellipse cx="-106" cy="0" rx="17" ry="28" fill="${C.R}" stroke="${C.K}" stroke-width="4"/>` +
      `<ellipse cx="-105" cy="2" rx="6.5" ry="15" fill="${C.K}"/><circle cx="-112" cy="-10" r="5.5" fill="${C.W}"/>` +
      `<path d="${P([[-170, -50], [-60, -50], [-60, -10], [-160, 2]])}" fill="${C.G1}"/></g>`;
    s += poly([[-166, 6], [-148, -22], [-104, -34], [-74, -24], [-60, -10], [-76, -14], [-104, -22], [-144, -12]], C.K);
    s += poly([[-138, 20], [-96, 18], [-88, 22], [-134, 25]], C.K);
    // near eye in shadow: dark sclera, glowing red iris, white glint
    const eyeN = [[0, 10], [16, -20], [60, -34], [106, -26], [126, -8], [110, 16], [62, 26], [20, 22]];
    s += `<path d="${P(eyeN)}" fill="${C.G3}"/>`;
    s += `<clipPath id="eyeN"><path d="${P(eyeN)}"/></clipPath><g clip-path="url(#eyeN)">` +
      `<ellipse cx="56" cy="2" rx="27" ry="34" fill="${C.R}"/>` +
      `<ellipse cx="57" cy="4" rx="10" ry="18" fill="${C.K}"/><circle cx="46" cy="-11" r="7" fill="${C.W}"/><circle cx="68" cy="15" r="3.5" fill="${C.W}"/>` +
      `<path d="${P([[-10, -50], [140, -50], [140, -14], [66, -26], [14, -10], [-10, -6]])}" fill="${C.K}"/></g>`;
    s += `<path d="${strand2(126, -8, 170, -40, 10, -4, 2)}" fill="${C.R}"/>`; // outer flick glows
    s += poly([[26, 28], [86, 26], [118, 14], [104, 28], [32, 32]], C.G2);
    s += poly([[4, -70], [66, -92], [146, -96], [82, -80], [8, -58]], C.G3);
    // nose shadow, mouth, lip
    s += poly([[-152, 96], [-124, 112], [-102, 104], [-118, 114], [-148, 110]], C.K);
    s += poly([[-142, 176], [-100, 172], [-62, 160], [-54, 165], [-94, 182], [-140, 182]], C.K);
    s += poly([[-120, 200], [-92, 198], [-106, 205]], C.K);
    // kumadori streaks on the shadowed cheek
    s += `<path d="${strand2(18, 58, 156, 136, 24, -10, 4)}" fill="${C.R}"/>`;
    s += `<path d="${strand2(52, 52, 112, 72, 10, -4, 2)}" fill="${C.R}"/>`;
    // hair: cast shadow (falls down-right), mass, separations, halftone highlight
    s += `<g transform="translate(-2,26)">${hair()}</g>`;
    s += hair();
    // halftone highlight: a crescent of white dots on the lit crown, sized by distance from the arc, cut by lock separations
    s += `<clipPath id="hiClip"><path d="${SKULL}"/>${LOCKS.map((a) => `<path d="${strand2(...a)}"/>`).join('')}</clipPath>`;
    s += `<g clip-path="url(#hiClip)">` + dots(-300, -470, 260, -60, 12, 45, (x, y) => {
      const q = Math.hypot((x - 30) / 236, (y + 20) / 300);
      const d = (q - 0.99) / 0.13;
      const lit = x < 210 && y < -130;
      return lit ? 5.6 * Math.max(0, 1 - d * d) : 0;
    }, C.W) + `</g>`;
    SEPS.forEach((a) => { s += `<path d="${strand2(...a)}" fill="${C.K}"/>`; });
    INNER.forEach((a) => { s += `<path d="${strand2(...a)}" fill="${C.G3}"/>`; });
    return s;
  }

  // ---------- body (hero-local, untilted). Shoulders on the counter-diagonal. ----------
  function body() {
    let s = '';
    s += poly([[-40, 390], [-150, 420], [-236, 450], [-290, 560], [-330, 1400], [560, 1400], [560, 640], [380, 556], [160, 420]], C.G3);
    s += poly([[-30, 430], [170, 410], [300, 1400], [-90, 1400]], C.K);
    s += poly([[-10, 420], [140, 400], [70, 720]], C.K);
    s += poly([[-46, 426], [-10, 420], [70, 722], [48, 742]], C.G2);
    s += poly([[-10, 420], [14, 416], [86, 712], [70, 722]], C.W);
    s += poly([[164, 404], [200, 416], [84, 756], [64, 740]], C.G2);
    s += poly([[140, 400], [164, 404], [64, 740], [48, 730]], C.W);
    // haori lapels, edge highlight, red lining
    s += poly([[-80, 430], [-36, 424], [-70, 1400], [-140, 1400]], C.K);
    s += poly([[-36, 424], [-26, 426], [-60, 1400], [-70, 1400]], C.G2);
    s += poly([[-56, 900], [-44, 900], [-60, 1400], [-74, 1400]], C.R);
    s += poly([[200, 416], [250, 426], [350, 1400], [290, 1400]], C.K);
    s += poly([[192, 414], [200, 416], [290, 1400], [280, 1400]], C.G2);
    s += poly([[240, 900], [252, 900], [298, 1400], [284, 1400]], C.R);
    // ink creases on the haori (black) + light folds (grey)
    [[-210, 520, -170, 1100, 26, 14, -6], [-150, 480, -110, 820, 14, 8, -4], [400, 700, 440, 1300, 24, -10, 6], [470, 680, 530, 1000, 14, -6, 4], [300, 620, 330, 980, 12, -6, 4]].forEach((a) => { s += `<path d="${strand2(...a)}" fill="${C.K}"/>`; });
    [[-250, 560, -230, 900, 10, 8, -4], [350, 760, 380, 1100, 9, -6, 4]].forEach((a) => { s += `<path d="${strand2(...a)}" fill="${C.G2}"/>`; });
    // shoulder: white cel sliver + grey folds + sheen dots
    s += `<path d="${strand2(220, 452, 560, 650, 12, -4, 2)}" fill="${C.W}"/>`;
    s += `<path d="${strand2(270, 520, 560, 700, 26, -6, 4)}" fill="${C.G2}"/>`;
    s += `<path d="${strand2(330, 620, 560, 780, 14, -4, 2)}" fill="${C.G2}"/>`;
    s += `<clipPath id="bodyClip"><path d="${P([[300, 560], [560, 660], [560, 980], [340, 980]])}"/></clipPath>`;
    s += `<g clip-path="url(#bodyClip)">` + dots(300, 560, 560, 980, 13, 30, (x, y) => {
      const t = (x - 300) / 260 - (y - 560) / 520; return t > 0 ? Math.min(4.4, t * 7) : 0;
    }, C.G2) + `</g>`;
    // crest (original): ring with three fox-flame commas
    // haori-himo (bottom zone)
    s += `<path d="M-60,1060 Q110,1092 270,1040" fill="none" stroke="${C.K}" stroke-width="22"/><path d="M-60,1060 Q110,1092 270,1040" fill="none" stroke="${C.R}" stroke-width="12"/>`;
    s += `<circle cx="110" cy="1072" r="22" fill="${C.R}" stroke="${C.K}" stroke-width="6"/>`;
    s += `<path d="${strand(98, 1086, 84, 1210, 22, 6)}" fill="${C.R}" stroke="${C.K}" stroke-width="4"/><path d="${strand(122, 1086, 140, 1200, 22, -6)}" fill="${C.R}" stroke="${C.K}" stroke-width="4"/>`;
    return s;
  }

  // raised arm: one big sleeve sail hanging from the forearm
  function arm() {
    let s = '';
    s += poly([[-300, 100], [-236, 122], [-236, 450], [-290, 600], [-436, 800], [-586, 590], [-396, 168]], C.G3);
    s += poly([[-396, 168], [-330, 240], [-300, 600], [-436, 800], [-586, 590]], C.K);
    s += poly([[-396, 168], [-300, 100], [-286, 196], [-338, 252]], C.R);
    s += `<path d="${strand2(-290, 140, -250, 460, 14, -10, 6)}" fill="${C.G2}"/>`;
    s += `<path d="${strand2(-560, 600, -430, 770, 14, -6, 2)}" fill="${C.G2}"/>`;
    s += `<path d="${strand2(-520, 480, -436, 780, 10, 10, -4)}" fill="${C.G3}"/>`;
    s += `<path d="${strand2(-400, 220, -330, 640, 10, 16, -6)}" fill="${C.G3}"/>`;
    return s;
  }

  // gloved fist gripping the mask's chin
  function hand() {
    let s = '';
    s += poly([[-378, 118], [-300, 118], [-280, 70], [-258, 28], [-262, -6], [-284, -4], [-292, -26], [-306, -40], [-322, -32], [-328, -46], [-344, -54], [-360, -42],
      [-364, -48], [-380, -52], [-394, -36], [-398, -28], [-412, -26], [-418, 0], [-410, 40], [-392, 82]], C.K);
    [[-325, -30, -322, 12], [-361, -40, -356, 6], [-396, -30, -390, 12]].forEach((l) => { s += `<path d="M${l[0]},${l[1]} L${l[2]},${l[3]}" stroke="${C.G2}" stroke-width="3.5"/>`; });
    [[-300, -12], [-338, -20], [-374, -20], [-404, -8]].forEach((k) => { s += `<path d="${strand(k[0] + 12, k[1] + 6, k[0] - 10, k[1] - 2, 7, -2)}" fill="${C.G2}"/>`; });
    s += `<path d="${strand(-270, 20, -300, 80, 8, -4)}" fill="${C.G2}"/>`;
    s += `<path d="${strand(-400, 60, -320, 96, 8, 4)}" fill="${C.G3}"/>`;
    return s;
  }

  root.P5H = { head, body, arm, hand, hair, FACE, SHADOW };
})(typeof window !== 'undefined' ? window : globalThis);
