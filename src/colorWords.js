// Word-to-HSL-range dictionary for semantic color analysis.
// Each entry maps a word to bounds: h (hue 0-360), s (saturation %), l (lightness %).
// Edit entries freely — hue sets the color family, s/l control vibrancy and brightness.

const COLOR_WORDS = {
  // --- Direct colors ---
  red:        { h: [0,   15],  s: [65, 90],  l: [35, 55] },
  orange:     { h: [20,  40],  s: [70, 95],  l: [45, 62] },
  yellow:     { h: [45,  65],  s: [70, 95],  l: [50, 68] },
  green:      { h: [100, 145], s: [40, 70],  l: [28, 55] },
  blue:       { h: [200, 240], s: [50, 80],  l: [33, 55] },
  purple:     { h: [260, 290], s: [38, 65],  l: [30, 55] },
  pink:       { h: [320, 348], s: [55, 82],  l: [58, 78] },
  violet:     { h: [270, 292], s: [42, 70],  l: [32, 55] },
  magenta:    { h: [298, 322], s: [58, 85],  l: [38, 60] },
  cyan:       { h: [172, 196], s: [58, 85],  l: [38, 60] },
  teal:       { h: [168, 190], s: [42, 70],  l: [28, 50] },
  indigo:     { h: [238, 265], s: [42, 70],  l: [28, 50] },
  brown:      { h: [20,  40],  s: [33, 55],  l: [22, 40] },
  gold:       { h: [40,  55],  s: [72, 95],  l: [42, 60] },
  silver:     { h: [200, 225], s: [8,  25],  l: [58, 78] },
  white:      { h: [30,  60],  s: [5,  18],  l: [80, 96] },
  black:      { h: [215, 245], s: [8,  20],  l: [5,  20] },
  gray:       { h: [210, 230], s: [5,  18],  l: [38, 62] },
  grey:       { h: [210, 230], s: [5,  18],  l: [38, 62] },
  beige:      { h: [35,  52],  s: [28, 50],  l: [68, 85] },
  ivory:      { h: [43,  60],  s: [18, 40],  l: [80, 93] },
  crimson:    { h: [348, 12],  s: [68, 90],  l: [28, 45] },
  scarlet:    { h: [5,   22],  s: [78, 100], l: [38, 55] },
  maroon:     { h: [0,   20],  s: [52, 75],  l: [18, 35] },
  coral:      { h: [10,  30],  s: [68, 90],  l: [58, 75] },
  peach:      { h: [18,  38],  s: [58, 85],  l: [68, 85] },
  lavender:   { h: [243, 275], s: [32, 60],  l: [63, 80] },
  lilac:      { h: [268, 300], s: [28, 55],  l: [63, 80] },
  rose:       { h: [328, 356], s: [52, 80],  l: [52, 72] },
  amber:      { h: [33,  50],  s: [78, 100], l: [42, 60] },
  turquoise:  { h: [168, 190], s: [62, 85],  l: [38, 60] },
  ochre:      { h: [38,  52],  s: [55, 78],  l: [38, 55] },
  slate:      { h: [208, 230], s: [18, 38],  l: [35, 55] },
  charcoal:   { h: [210, 235], s: [10, 25],  l: [18, 35] },
  cream:      { h: [45,  62],  s: [45, 68],  l: [80, 92] },
  blush:      { h: [340, 360], s: [48, 75],  l: [68, 85] },

  // --- Water & sky ---
  ocean:      { h: [198, 225], s: [52, 80],  l: [28, 50] },
  sea:        { h: [192, 220], s: [48, 75],  l: [32, 55] },
  water:      { h: [192, 218], s: [52, 80],  l: [38, 60] },
  lake:       { h: [198, 225], s: [42, 70],  l: [32, 55] },
  river:      { h: [192, 220], s: [38, 65],  l: [32, 55] },
  rain:       { h: [202, 232], s: [28, 55],  l: [42, 65] },
  storm:      { h: [212, 242], s: [22, 50],  l: [22, 45] },
  fog:        { h: [198, 230], s: [8,  28],  l: [58, 80] },
  mist:       { h: [198, 228], s: [12, 35],  l: [63, 82] },
  haze:       { h: [195, 225], s: [10, 30],  l: [60, 80] },
  drizzle:    { h: [205, 232], s: [20, 45],  l: [55, 75] },
  puddle:     { h: [205, 230], s: [25, 50],  l: [45, 65] },
  flood:      { h: [205, 235], s: [38, 65],  l: [28, 48] },
  ice:        { h: [192, 215], s: [28, 55],  l: [72, 90] },
  snow:       { h: [198, 228], s: [8,  25],  l: [84, 96] },
  frost:      { h: [192, 215], s: [22, 50],  l: [72, 90] },
  sleet:      { h: [200, 228], s: [15, 38],  l: [65, 85] },
  sky:        { h: [192, 222], s: [52, 80],  l: [52, 75] },
  cloud:      { h: [198, 228], s: [8,  28],  l: [73, 90] },
  wave:       { h: [188, 215], s: [52, 80],  l: [38, 60] },
  tide:       { h: [192, 220], s: [42, 70],  l: [32, 55] },
  shore:      { h: [38,  58],  s: [38, 62],  l: [65, 80] },
  pool:       { h: [182, 210], s: [45, 72],  l: [42, 65] },
  stream:     { h: [190, 218], s: [40, 68],  l: [38, 60] },
  brook:      { h: [188, 215], s: [38, 65],  l: [40, 62] },
  marsh:      { h: [112, 145], s: [28, 52],  l: [28, 48] },
  swamp:      { h: [108, 140], s: [25, 50],  l: [22, 42] },

  // --- Light & sky events ---
  dusk:       { h: [18,  45],  s: [52, 80],  l: [42, 65] },
  dawn:       { h: [23,  50],  s: [58, 85],  l: [52, 75] },
  sunrise:    { h: [18,  40],  s: [68, 95],  l: [52, 75] },
  sunset:     { h: [12,  35],  s: [68, 95],  l: [47, 70] },
  twilight:   { h: [248, 282], s: [32, 60],  l: [28, 50] },
  night:      { h: [222, 255], s: [28, 55],  l: [8,  30] },
  midnight:   { h: [228, 262], s: [38, 65],  l: [6,  22] },
  moon:       { h: [43,  65],  s: [12, 35],  l: [73, 90] },
  moonlight:  { h: [48,  70],  s: [12, 35],  l: [78, 93] },
  star:       { h: [43,  65],  s: [28, 60],  l: [78, 95] },
  starlight:  { h: [43,  70],  s: [22, 55],  l: [80, 95] },
  shadow:     { h: [225, 258], s: [18, 42],  l: [12, 32] },
  darkness:   { h: [225, 258], s: [15, 38],  l: [8,  25] },
  sunlight:   { h: [45,  65],  s: [72, 95],  l: [65, 82] },
  glow:       { h: [38,  58],  s: [68, 92],  l: [60, 80] },
  shimmer:    { h: [45,  70],  s: [45, 72],  l: [70, 88] },

  // --- Fire & heat ---
  fire:       { h: [8,   35],  s: [82, 100], l: [42, 60] },
  flame:      { h: [12,  40],  s: [82, 100], l: [48, 65] },
  ember:      { h: [8,   28],  s: [68, 90],  l: [32, 50] },
  ash:        { h: [20,  42],  s: [8,  25],  l: [48, 68] },
  smoke:      { h: [20,  42],  s: [6,  20],  l: [38, 60] },
  coal:       { h: [215, 242], s: [8,  25],  l: [10, 25] },
  spark:      { h: [40,  60],  s: [80, 100], l: [60, 80] },
  heat:       { h: [8,   28],  s: [65, 90],  l: [50, 68] },
  inferno:    { h: [5,   25],  s: [85, 100], l: [35, 52] },

  // --- Earth & minerals ---
  earth:      { h: [23,  45],  s: [32, 55],  l: [28, 50] },
  soil:       { h: [23,  42],  s: [32, 55],  l: [22, 40] },
  mud:        { h: [23,  42],  s: [28, 50],  l: [20, 38] },
  sand:       { h: [38,  60],  s: [42, 65],  l: [63, 80] },
  stone:      { h: [198, 232], s: [8,  25],  l: [42, 65] },
  rock:       { h: [198, 232], s: [6,  20],  l: [38, 60] },
  clay:       { h: [18,  40],  s: [38, 65],  l: [48, 68] },
  dust:       { h: [33,  55],  s: [18, 40],  l: [58, 75] },
  gravel:     { h: [208, 232], s: [8,  22],  l: [48, 65] },
  pebble:     { h: [205, 230], s: [8,  22],  l: [50, 68] },
  rust:       { h: [13,  30],  s: [58, 80],  l: [32, 50] },
  copper:     { h: [18,  35],  s: [52, 75],  l: [42, 60] },
  bronze:     { h: [28,  45],  s: [48, 70],  l: [32, 50] },
  iron:       { h: [208, 235], s: [8,  25],  l: [32, 55] },
  steel:      { h: [202, 232], s: [12, 30],  l: [48, 70] },
  obsidian:   { h: [245, 275], s: [15, 35],  l: [8,  22] },
  quartz:     { h: [30,  60],  s: [12, 32],  l: [78, 92] },

  // --- Plants & forest ---
  forest:     { h: [112, 145], s: [32, 60],  l: [18, 40] },
  grass:      { h: [98,  130], s: [42, 70],  l: [32, 55] },
  leaf:       { h: [108, 140], s: [42, 70],  l: [28, 50] },
  leaves:     { h: [108, 140], s: [42, 70],  l: [28, 50] },
  moss:       { h: [98,  125], s: [28, 55],  l: [28, 50] },
  fern:       { h: [108, 135], s: [38, 65],  l: [28, 50] },
  pine:       { h: [128, 152], s: [32, 60],  l: [18, 40] },
  wood:       { h: [23,  45],  s: [38, 60],  l: [28, 50] },
  bark:       { h: [23,  42],  s: [32, 55],  l: [22, 42] },
  root:       { h: [25,  45],  s: [28, 52],  l: [22, 42] },
  branch:     { h: [25,  45],  s: [28, 52],  l: [28, 48] },
  petal:      { h: [322, 356], s: [52, 80],  l: [63, 80] },
  bloom:      { h: [328, 362], s: [52, 80],  l: [58, 78] },
  blossom:    { h: [328, 356], s: [48, 75],  l: [63, 80] },
  flower:     { h: [320, 360], s: [55, 82],  l: [58, 78] },
  pollen:     { h: [48,  65],  s: [72, 95],  l: [65, 80] },
  lichen:     { h: [78,  108], s: [22, 48],  l: [45, 65] },
  vine:       { h: [105, 135], s: [32, 58],  l: [28, 50] },
  thorn:      { h: [110, 140], s: [28, 52],  l: [22, 42] },
  fruit:      { h: [8,   35],  s: [68, 92],  l: [42, 62] },
  berry:      { h: [328, 358], s: [55, 80],  l: [35, 55] },

  // --- Emotions ---
  grief:      { h: [218, 258], s: [18, 45],  l: [22, 45] },
  sorrow:     { h: [222, 258], s: [18, 42],  l: [22, 42] },
  sadness:    { h: [212, 252], s: [22, 50],  l: [28, 50] },
  melancholy: { h: [228, 268], s: [18, 45],  l: [28, 50] },
  longing:    { h: [238, 272], s: [22, 50],  l: [32, 55] },
  nostalgia:  { h: [28,  55],  s: [32, 60],  l: [52, 72] },
  memory:     { h: [33,  60],  s: [22, 50],  l: [52, 75] },
  loneliness: { h: [222, 262], s: [18, 45],  l: [22, 45] },
  solitude:   { h: [222, 258], s: [12, 40],  l: [28, 52] },
  despair:    { h: [238, 272], s: [22, 50],  l: [15, 35] },
  anguish:    { h: [232, 268], s: [25, 52],  l: [18, 38] },
  joy:        { h: [43,  65],  s: [78, 100], l: [52, 70] },
  happiness:  { h: [48,  70],  s: [72, 95],  l: [52, 72] },
  delight:    { h: [42,  65],  s: [72, 95],  l: [58, 75] },
  love:       { h: [338, 362], s: [62, 90],  l: [48, 70] },
  passion:    { h: [342, 18],  s: [72, 95],  l: [38, 60] },
  desire:     { h: [342, 15],  s: [65, 90],  l: [40, 62] },
  rage:       { h: [0,   15],  s: [78, 100], l: [32, 50] },
  anger:      { h: [3,   20],  s: [72, 95],  l: [32, 52] },
  fury:       { h: [0,   12],  s: [82, 100], l: [28, 48] },
  fear:       { h: [248, 282], s: [22, 50],  l: [18, 40] },
  dread:      { h: [252, 288], s: [18, 45],  l: [12, 35] },
  terror:     { h: [248, 285], s: [22, 50],  l: [12, 32] },
  calm:       { h: [192, 225], s: [28, 55],  l: [48, 70] },
  peace:      { h: [178, 212], s: [22, 50],  l: [52, 75] },
  serenity:   { h: [182, 215], s: [22, 50],  l: [55, 78] },
  hope:       { h: [68,  100], s: [42, 70],  l: [48, 70] },
  wonder:     { h: [198, 242], s: [38, 65],  l: [52, 75] },
  awe:        { h: [228, 268], s: [32, 60],  l: [38, 60] },
  tenderness: { h: [332, 358], s: [38, 65],  l: [65, 82] },
  warmth:     { h: [22,  45],  s: [60, 85],  l: [52, 72] },
  yearning:   { h: [238, 272], s: [28, 55],  l: [35, 58] },
  reverie:    { h: [248, 285], s: [22, 50],  l: [55, 78] },
  wistful:    { h: [232, 268], s: [20, 48],  l: [45, 68] },

  // --- Sensory & abstract ---
  warm:       { h: [18,  45],  s: [58, 85],  l: [52, 72] },
  cold:       { h: [198, 232], s: [38, 65],  l: [52, 75] },
  dark:       { h: [218, 262], s: [18, 45],  l: [8,  30] },
  bright:     { h: [48,  80],  s: [72, 100], l: [62, 82] },
  pale:       { h: [28,  60],  s: [12, 35],  l: [73, 92] },
  deep:       { h: [218, 262], s: [38, 65],  l: [12, 35] },
  soft:       { h: [28,  60],  s: [18, 45],  l: [68, 88] },
  sharp:      { h: [198, 232], s: [58, 85],  l: [42, 65] },
  sweet:      { h: [318, 352], s: [52, 80],  l: [63, 82] },
  bitter:     { h: [98,  132], s: [28, 55],  l: [22, 45] },
  sour:       { h: [68,  95],  s: [62, 88],  l: [52, 72] },
  hollow:     { h: [28,  55],  s: [12, 35],  l: [48, 70] },
  still:      { h: [198, 228], s: [12, 35],  l: [52, 75] },
  silent:     { h: [218, 252], s: [8,  30],  l: [42, 65] },
  quiet:      { h: [212, 248], s: [8,  28],  l: [45, 68] },
  loud:       { h: [8,   35],  s: [78, 100], l: [48, 68] },
  heavy:      { h: [215, 252], s: [22, 48],  l: [18, 40] },
  light:      { h: [48,  70],  s: [28, 55],  l: [78, 95] },
  ancient:    { h: [33,  55],  s: [22, 50],  l: [38, 60] },
  forgotten:  { h: [28,  52],  s: [15, 40],  l: [42, 65] },
  broken:     { h: [215, 248], s: [15, 38],  l: [30, 52] },
  golden:     { h: [38,  55],  s: [72, 95],  l: [47, 65] },
  electric:   { h: [248, 278], s: [72, 100], l: [55, 78] },
  neon:       { h: [75,  110], s: [85, 100], l: [60, 80] },
  crystal:    { h: [195, 222], s: [35, 62],  l: [72, 90] },
  hollow:     { h: [30,  55],  s: [12, 35],  l: [48, 70] },
  velvet:     { h: [268, 302], s: [32, 60],  l: [22, 45] },
  silk:       { h: [328, 362], s: [32, 60],  l: [68, 88] },
  glass:      { h: [192, 218], s: [22, 50],  l: [68, 88] },

  // --- Time & place ---
  morning:    { h: [38,  60],  s: [58, 85],  l: [63, 82] },
  afternoon:  { h: [43,  65],  s: [62, 90],  l: [62, 80] },
  evening:    { h: [23,  50],  s: [52, 80],  l: [42, 65] },
  winter:     { h: [202, 232], s: [22, 50],  l: [63, 85] },
  summer:     { h: [48,  75],  s: [68, 95],  l: [52, 75] },
  autumn:     { h: [23,  50],  s: [58, 85],  l: [42, 65] },
  fall:       { h: [18,  45],  s: [60, 88],  l: [40, 65] },
  spring:     { h: [98,  135], s: [42, 70],  l: [52, 75] },
  desert:     { h: [35,  58],  s: [48, 75],  l: [55, 75] },
  arctic:     { h: [198, 225], s: [22, 50],  l: [72, 92] },
  tropical:   { h: [168, 205], s: [55, 85],  l: [42, 65] },
  urban:      { h: [210, 238], s: [8,  28],  l: [35, 60] },
  ruin:       { h: [28,  52],  s: [22, 48],  l: [32, 55] },
  garden:     { h: [108, 145], s: [38, 68],  l: [38, 62] },
};

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function textHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

// Strips common suffixes to find a base word in the dictionary.
function lookupWord(word) {
  if (COLOR_WORDS[word]) return COLOR_WORDS[word];
  if (word.length > 3 && COLOR_WORDS[word.slice(0, -1)]) return COLOR_WORDS[word.slice(0, -1)]; // -s, -y
  if (word.length > 4 && COLOR_WORDS[word.slice(0, -2)]) return COLOR_WORDS[word.slice(0, -2)]; // -ed, -er
  if (word.length > 5 && COLOR_WORDS[word.slice(0, -3)]) return COLOR_WORDS[word.slice(0, -3)]; // -ing, -ful
  if (word.length > 6 && COLOR_WORDS[word.slice(0, -4)]) return COLOR_WORDS[word.slice(0, -4)]; // -ness, -tion
  return null;
}

export function analyzeDescription(text) {
  const hash = textHash(text);
  const absHash = Math.abs(hash);

  const words = text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);

  // Collect first two distinct keyword matches
  const matches = [];
  for (const word of words) {
    if (matches.length >= 2) break;
    const entry = lookupWord(word);
    if (entry && !matches.includes(entry)) matches.push(entry);
  }

  let h, s, l;

  if (matches.length > 0) {
    const primary = matches[0];
    const hRange = primary.h[1] - primary.h[0];
    const sRange = primary.s[1] - primary.s[0];
    const lRange = primary.l[1] - primary.l[0];

    // Use different bit regions of the hash for each dimension
    h = primary.h[0] + (absHash % (hRange || 1));
    s = primary.s[0] + ((absHash >> 6)  % (sRange || 1));
    l = primary.l[0] + ((absHash >> 12) % (lRange || 1));

    // If a second keyword matched, nudge hue toward its center (30% weight)
    if (matches.length > 1) {
      const secondary = matches[1];
      const h2center = (secondary.h[0] + secondary.h[1]) / 2;
      const h1center = (primary.h[0] + primary.h[1]) / 2;
      // Nudge by at most 15% of the primary range toward the secondary hue center
      const nudge = (h2center - h1center) * 0.15;
      h = h + nudge;
    }

    h = ((h % 360) + 360) % 360;
  } else {
    // Fallback: hash-derived color
    h = absHash % 360;
    s = 55 + (absHash % 35);
    l = 40 + (absHash % 25);
  }

  return hslToHex(h, s, l);
}
