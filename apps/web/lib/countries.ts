/**
 * Country flag database with structural and heraldic metadata.
 *
 * Each entry carries:
 *   • name, code (ISO 3166 alpha-2), region
 *   • aspect_ratio (width/height) so non 3:2 flags render correctly
 *   • palette (ordered prominent colors)
 *   • symbolism (one sentence)
 *   • heraldic_family (high-level layout family)
 *   • properties (algorithmic match dimensions)
 *   • svg (rendered as plain SVG markup, no external assets)
 */

export type FlagLayout =
  | 'horizontal_stripes'
  | 'vertical_stripes'
  | 'cross'
  | 'chevron'
  | 'circle_center'
  | 'complex';

export type ColorWarmth = 'warm' | 'cool' | 'neutral' | 'dark';
export type DominantHue =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'black'
  | 'white'
  | 'mixed';

export type Region =
  | 'europe'
  | 'asia'
  | 'africa'
  | 'americas'
  | 'oceania'
  | 'middle_east';

export type HeraldicFamily =
  | 'tricolor_horizontal'
  | 'tricolor_vertical'
  | 'bicolor_horizontal'
  | 'bicolor_vertical'
  | 'nordic_cross'
  | 'centered_cross'
  | 'saltire'
  | 'pall'
  | 'canton_with_charge'
  | 'triangle_hoist'
  | 'crescent_star'
  | 'centered_disc'
  | 'centered_charge'
  | 'multi_stripe'
  | 'quartered'
  | 'serration'
  | 'other';

export type CountryFlag = {
  name: string;
  code: string;
  region: Region;
  aspect_ratio: number;
  palette: string[];
  symbolism: string;
  heraldic_family: HeraldicFamily;
  properties: {
    layout: FlagLayout;
    stripe_count: number;
    color_count: number;
    has_stars: boolean;
    has_circle: boolean;
    has_cross: boolean;
    has_crescent: boolean;
    sentiment_affinity: 'positive' | 'neutral' | 'negative';
    complexity: 'simple' | 'medium' | 'complex';
    color_warmth: ColorWarmth;
    is_symmetric: boolean;
    dominant_hue: DominantHue;
  };
  svg: string;
};

// ── SVG helpers ───────────────────────────────────────────────────────────────

function svgWrap(body: string, w = 900, h = 600): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Country flag">\n` +
    body +
    `\n</svg>`
  );
}

function rect(x: number, y: number, w: number, h: number, fill: string): string {
  return `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
}

function hStripes(colors: string[], w = 900, h = 600): string {
  const sh = h / colors.length;
  return colors
    .map((c, i) => rect(0, i * sh, w, sh + 0.5, c))
    .join('\n');
}

function vStripes(colors: string[], w = 900, h = 600): string {
  const sw = w / colors.length;
  return colors
    .map((c, i) => rect(i * sw, 0, sw + 0.5, h, c))
    .join('\n');
}

/** Horizontal stripes with explicit per-stripe weights (sum need not equal 1). */
function hStripesWeighted(items: { color: string; weight: number }[], w = 900, h = 600): string {
  const total = items.reduce((s, x) => s + x.weight, 0);
  let y = 0;
  const out: string[] = [];
  for (const it of items) {
    const sh = (h * it.weight) / total;
    out.push(rect(0, y, w, sh + 0.5, it.color));
    y += sh;
  }
  return out.join('\n');
}

/**
 * Nordic cross with authentic offset toward the hoist.
 * Cross thickness ≈ 1/6 of height, vertical bar centered at 5/16 of width.
 */
function nordicCross(bg: string, cross: string, opts?: { fimbriation?: string }): string {
  const w = 900,
    h = 600;
  const t = 100; // cross thickness
  const vx = 275; // vertical bar x (so center is at 325, ~36% from hoist)
  const hy = 250; // horizontal bar y
  const out: string[] = [rect(0, 0, w, h, bg)];
  if (opts?.fimbriation) {
    const f = 30;
    out.push(rect(vx - f, 0, t + f * 2, h, opts.fimbriation));
    out.push(rect(0, hy - f, w, t + f * 2, opts.fimbriation));
  }
  out.push(rect(vx, 0, t, h, cross));
  out.push(rect(0, hy, w, t, cross));
  return out.join('\n');
}

function star5(cx: number, cy: number, r: number, fill: string, rotation = -Math.PI / 2): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const a = (Math.PI / 5) * i + rotation;
    pts.push(`${(cx + Math.cos(a) * radius).toFixed(2)},${(cy + Math.sin(a) * radius).toFixed(2)}`);
  }
  return `  <polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

/** Star of David rendered as two overlapping outlined triangles. */
function starOfDavid(cx: number, cy: number, r: number, fill: string, stroke = 18): string {
  const a = (k: number) => (Math.PI / 3) * k - Math.PI / 2;
  const tri = (rotOffset: number) =>
    [0, 2, 4]
      .map((k) => {
        const ang = a(k) + rotOffset;
        return `${(cx + Math.cos(ang) * r).toFixed(2)},${(cy + Math.sin(ang) * r).toFixed(2)}`;
      })
      .join(' ');
  return [
    `  <polygon points="${tri(0)}" fill="none" stroke="${fill}" stroke-width="${stroke}" stroke-linejoin="miter"/>`,
    `  <polygon points="${tri(Math.PI)}" fill="none" stroke="${fill}" stroke-width="${stroke}" stroke-linejoin="miter"/>`,
  ].join('\n');
}

/** Crescent moon by occluding a disc with a smaller disc shifted toward the fly. */
function crescent(cx: number, cy: number, r: number, fill: string, bgFill: string, offset = 0.28): string {
  return [
    `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`,
    `  <circle cx="${(cx + r * offset).toFixed(2)}" cy="${cy}" r="${(r * 0.84).toFixed(2)}" fill="${bgFill}"/>`,
  ].join('\n');
}

function circle(cx: number, cy: number, r: number, fill: string, opts?: { stroke?: string; sw?: number }): string {
  if (opts?.stroke) {
    return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${opts.stroke}" stroke-width="${opts.sw ?? 4}"/>`;
  }
  return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

function polygon(points: Array<[number, number]>, fill: string): string {
  return `  <polygon points="${points.map(([x, y]) => `${x},${y}`).join(' ')}" fill="${fill}"/>`;
}

// ── Common palette aliases ────────────────────────────────────────────────────

const C = {
  white: '#FFFFFF',
  black: '#000000',
  panRed: '#CE1126',
  panGreen: '#078930',
  panYellow: '#FCDD09',
  panBlack: '#000000',
} as const;

// ── Flag database ─────────────────────────────────────────────────────────────

export const COUNTRY_FLAGS: CountryFlag[] = [
  // ══ HORIZONTAL TRICOLORS ══════════════════════════════════════════════════
  {
    name: 'Germany', code: 'DE', region: 'europe', aspect_ratio: 5 / 3,
    palette: ['#000000', '#DD0000', '#FFCC00'],
    symbolism: 'Bands of black, red, and gold trace back to the uniforms of nineteenth century Prussian volunteer units.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'dark', is_symmetric: true, dominant_hue: 'black' },
    svg: svgWrap(hStripes(['#000000', '#DD0000', '#FFCC00'])),
  },
  {
    name: 'Netherlands', code: 'NL', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#AE1C28', '#FFFFFF', '#21468B'],
    symbolism: 'The Prinsenvlag of the Dutch revolt, later standardized into red, white, and blue.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'neutral', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(hStripes(['#AE1C28', '#FFFFFF', '#21468B'])),
  },
  {
    name: 'Russia', code: 'RU', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#FFFFFF', '#0039A6', '#D52B1E'],
    symbolism: 'The Pan-Slavic banner of white, blue, and red, adapted from Peter the Great\'s naval ensign.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'mixed' },
    svg: svgWrap(hStripes(['#FFFFFF', '#0039A6', '#D52B1E'])),
  },
  {
    name: 'Hungary', code: 'HU', region: 'europe', aspect_ratio: 2 / 1,
    palette: ['#CE2939', '#FFFFFF', '#477050'],
    symbolism: 'Red for strength, white for fidelity, green for hope.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(hStripes(['#CE2939', '#FFFFFF', '#477050'])),
  },
  {
    name: 'Austria', code: 'AT', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#ED2939', '#FFFFFF'],
    symbolism: 'Said to recall the blood-soaked tunic of Duke Leopold V after the Battle of Acre.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(hStripes(['#ED2939', '#FFFFFF', '#ED2939'])),
  },
  {
    name: 'Estonia', code: 'EE', region: 'europe', aspect_ratio: 11 / 7,
    palette: ['#0072CE', '#000000', '#FFFFFF'],
    symbolism: 'Sky and sea (blue), the dark earth (black), and the people\'s yearning for light (white).',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'negative', complexity: 'simple', color_warmth: 'dark', is_symmetric: true, dominant_hue: 'blue' },
    svg: svgWrap(hStripes(['#0072CE', '#000000', '#FFFFFF'])),
  },
  {
    name: 'Lithuania', code: 'LT', region: 'europe', aspect_ratio: 5 / 3,
    palette: ['#FDB913', '#006A44', '#C1272D'],
    symbolism: 'Sun-yellow fields, deep forests, and the courage and blood of patriots.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'yellow' },
    svg: svgWrap(hStripes(['#FDB913', '#006A44', '#C1272D'])),
  },
  {
    name: 'Colombia', code: 'CO', region: 'americas', aspect_ratio: 3 / 2,
    palette: ['#FCD116', '#003893', '#CE1126'],
    symbolism: 'A Bolivarian banner in which yellow stands for sovereignty, blue for the seas, red for liberation.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'yellow' },
    svg: svgWrap(hStripesWeighted([
      { color: '#FCD116', weight: 2 },
      { color: '#003893', weight: 1 },
      { color: '#CE1126', weight: 1 },
    ])),
  },
  {
    name: 'Armenia', code: 'AM', region: 'asia', aspect_ratio: 2 / 1,
    palette: ['#D90012', '#0033A0', '#F2A800'],
    symbolism: 'Red recalls the highlands and the spilled blood of survival, blue the open sky, gold the wheat of plenty.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(hStripes(['#D90012', '#0033A0', '#F2A800'])),
  },
  {
    name: 'Bulgaria', code: 'BG', region: 'europe', aspect_ratio: 5 / 3,
    palette: ['#FFFFFF', '#00966E', '#D62612'],
    symbolism: 'Peace, agriculture, and the courage of those who fought for independence.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap(hStripes(['#FFFFFF', '#00966E', '#D62612'])),
  },
  {
    name: 'Egypt', code: 'EG', region: 'middle_east', aspect_ratio: 3 / 2,
    palette: ['#CE1126', '#FFFFFF', '#000000', '#C09300'],
    symbolism: 'Red for the revolution, white for its bloodless transfer of power, black for centuries of foreign rule overcome.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 4, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap([
      hStripes(['#CE1126', '#FFFFFF', '#000000']),
      circle(450, 300, 60, '#C09300'),
      rect(425, 295, 50, 35, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Iran', code: 'IR', region: 'middle_east', aspect_ratio: 7 / 4,
    palette: ['#239F40', '#FFFFFF', '#DA0000'],
    symbolism: 'Green for Islam, white for peace, red for courage.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap(hStripes(['#239F40', '#FFFFFF', '#DA0000'])),
  },
  {
    name: 'Iraq', code: 'IQ', region: 'middle_east', aspect_ratio: 3 / 2,
    palette: ['#CE1126', '#FFFFFF', '#000000', '#007A3D'],
    symbolism: 'A Pan-Arab field. The central inscription, here suggested in green, reads "God is Great".',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 4, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'negative', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap([
      hStripes(['#CE1126', '#FFFFFF', '#000000']),
      `  <text x="450" y="320" text-anchor="middle" font-family="serif" font-size="68" fill="#007A3D" font-weight="bold" aria-hidden="true"></text>`,
      rect(380, 270, 18, 60, '#007A3D'),
      rect(420, 270, 18, 60, '#007A3D'),
      rect(460, 270, 18, 60, '#007A3D'),
      rect(500, 270, 18, 60, '#007A3D'),
    ].join('\n')),
  },
  {
    name: 'Yemen', code: 'YE', region: 'middle_east', aspect_ratio: 3 / 2,
    palette: ['#CE1126', '#FFFFFF', '#000000'],
    symbolism: 'A Pan-Arab tricolor in plain bands.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(hStripes(['#CE1126', '#FFFFFF', '#000000'])),
  },
  {
    name: 'Syria', code: 'SY', region: 'middle_east', aspect_ratio: 3 / 2,
    palette: ['#CE1126', '#FFFFFF', '#000000', '#007A3D'],
    symbolism: 'A Pan-Arab tricolor with two green stars.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 4, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'negative', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap([
      hStripes(['#CE1126', '#FFFFFF', '#000000']),
      star5(360, 300, 50, '#007A3D'),
      star5(540, 300, 50, '#007A3D'),
    ].join('\n')),
  },
  {
    name: 'Bolivia', code: 'BO', region: 'americas', aspect_ratio: 22 / 15,
    palette: ['#D52B1E', '#F9E300', '#007934'],
    symbolism: 'Red for the courage of the people, yellow for mineral wealth, green for fertile lands.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(hStripes(['#D52B1E', '#F9E300', '#007934'])),
  },
  {
    name: 'Ecuador', code: 'EC', region: 'americas', aspect_ratio: 2 / 1,
    palette: ['#FFDD00', '#0033A0', '#CE1126'],
    symbolism: 'A Bolivarian tricolor with the yellow band of double width to honor the sovereign sun.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'yellow' },
    svg: svgWrap(hStripesWeighted([
      { color: '#FFDD00', weight: 2 },
      { color: '#0033A0', weight: 1 },
      { color: '#CE1126', weight: 1 },
    ])),
  },
  {
    name: 'Venezuela', code: 'VE', region: 'americas', aspect_ratio: 3 / 2,
    palette: ['#FCE300', '#003DA5', '#CF142B', '#FFFFFF'],
    symbolism: 'A Bolivarian tricolor with eight white stars representing the provinces that signed independence.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 4, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      hStripes(['#FCE300', '#003DA5', '#CF142B']),
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 8 - Math.PI / 2;
        const cx = 450 + Math.cos(a) * 90;
        const cy = 300 + Math.sin(a) * 70;
        return star5(cx, cy, 22, '#FFFFFF');
      }),
    ].join('\n')),
  },
  {
    name: 'Ukraine', code: 'UA', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#0057B7', '#FFD700'],
    symbolism: 'Sky over wheat, the elemental landscape of the country.',
    heraldic_family: 'bicolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 2, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'blue' },
    svg: svgWrap(hStripes(['#0057B7', '#FFD700'])),
  },
  {
    name: 'Poland', code: 'PL', region: 'europe', aspect_ratio: 8 / 5,
    palette: ['#FFFFFF', '#DC143C'],
    symbolism: 'A medieval pairing taken from the Polish coat of arms.',
    heraldic_family: 'bicolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 2, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'white' },
    svg: svgWrap(hStripes(['#FFFFFF', '#DC143C'])),
  },
  {
    name: 'Indonesia', code: 'ID', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#CE1126', '#FFFFFF'],
    symbolism: 'Sang Saka Merah Putih, the red-and-white said to be older than the nation itself.',
    heraldic_family: 'bicolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 2, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(hStripes(['#CE1126', '#FFFFFF'])),
  },
  {
    name: 'Thailand', code: 'TH', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#A51931', '#F4F5F8', '#2D2A4A'],
    symbolism: 'Three colors said to stand for nation, religion, and king, adopted in 1917.',
    heraldic_family: 'multi_stripe',
    properties: { layout: 'horizontal_stripes', stripe_count: 5, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'neutral', is_symmetric: true, dominant_hue: 'mixed' },
    svg: svgWrap(hStripesWeighted([
      { color: '#A51931', weight: 1 },
      { color: '#F4F5F8', weight: 1 },
      { color: '#2D2A4A', weight: 2 },
      { color: '#F4F5F8', weight: 1 },
      { color: '#A51931', weight: 1 },
    ])),
  },
  {
    name: 'Costa Rica', code: 'CR', region: 'americas', aspect_ratio: 5 / 3,
    palette: ['#002B7F', '#FFFFFF', '#CE1126'],
    symbolism: 'Mirroring the French tricolor in honor of revolutionary ideals, with red as the heart of the people.',
    heraldic_family: 'multi_stripe',
    properties: { layout: 'horizontal_stripes', stripe_count: 5, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'blue' },
    svg: svgWrap(hStripesWeighted([
      { color: '#002B7F', weight: 1 },
      { color: '#FFFFFF', weight: 1 },
      { color: '#CE1126', weight: 2 },
      { color: '#FFFFFF', weight: 1 },
      { color: '#002B7F', weight: 1 },
    ])),
  },

  // ══ VERTICAL TRICOLORS ════════════════════════════════════════════════════
  {
    name: 'France', code: 'FR', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#002395', '#FFFFFF', '#ED2939'],
    symbolism: 'Le tricolore, fixed in 1794 from the cockade of revolutionary Paris.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'neutral', is_symmetric: true, dominant_hue: 'mixed' },
    svg: svgWrap(vStripes(['#002395', '#FFFFFF', '#ED2939'])),
  },
  {
    name: 'Italy', code: 'IT', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#009246', '#FFFFFF', '#CE2B37'],
    symbolism: 'Il Tricolore, born from the green and white standards of Lombard militias of 1796 and the red of revolution.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap(vStripes(['#009246', '#FFFFFF', '#CE2B37'])),
  },
  {
    name: 'Belgium', code: 'BE', region: 'europe', aspect_ratio: 13 / 15,
    palette: ['#000000', '#FAE042', '#ED2939'],
    symbolism: 'Vertical bands taken from the medieval ducal arms of Brabant.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'dark', is_symmetric: true, dominant_hue: 'mixed' },
    svg: svgWrap(vStripes(['#000000', '#FAE042', '#ED2939'])),
  },
  {
    name: 'Ireland', code: 'IE', region: 'europe', aspect_ratio: 2 / 1,
    palette: ['#169B62', '#FFFFFF', '#FF883E'],
    symbolism: 'Green for the Gaelic tradition, orange for William of Orange\'s followers, white for the peace between them.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap(vStripes(['#169B62', '#FFFFFF', '#FF883E'])),
  },
  {
    name: 'Romania', code: 'RO', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#002B7F', '#FCD116', '#CE1126'],
    symbolism: 'A nineteenth century Romantic banner echoing the colors of the principalities of Wallachia and Moldavia.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'mixed' },
    svg: svgWrap(vStripes(['#002B7F', '#FCD116', '#CE1126'])),
  },
  {
    name: 'Nigeria', code: 'NG', region: 'africa', aspect_ratio: 2 / 1,
    palette: ['#008751', '#FFFFFF'],
    symbolism: 'Green and white for agriculture and peace, designed by a student in 1959.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap(vStripes(['#008751', '#FFFFFF', '#008751'])),
  },
  {
    name: 'Peru', code: 'PE', region: 'americas', aspect_ratio: 3 / 2,
    palette: ['#D91023', '#FFFFFF'],
    symbolism: 'Said to recall the red and white feathers of the Inca empire\'s sacred birds.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(vStripes(['#D91023', '#FFFFFF', '#D91023'])),
  },
  {
    name: 'Mexico', code: 'MX', region: 'americas', aspect_ratio: 7 / 4,
    palette: ['#006847', '#FFFFFF', '#CE1126'],
    symbolism: 'Green for hope, white for purity, red for the blood of the heroes of independence.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'green' },
    svg: svgWrap([
      vStripes(['#006847', '#FFFFFF', '#CE1126']),
      circle(450, 300, 70, '#9E5526', { stroke: '#5C2E0F', sw: 4 }),
      circle(450, 300, 30, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Senegal', code: 'SN', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#00853F', '#FDEF42', '#E31B23'],
    symbolism: 'Green for hope, yellow for wealth, red for sacrifice, with a green star at the heart.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      vStripes(['#00853F', '#FDEF42', '#E31B23']),
      star5(450, 300, 60, '#00853F'),
    ].join('\n')),
  },
  {
    name: 'Mali', code: 'ML', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#14B53A', '#FCD116', '#CE1126'],
    symbolism: 'The Pan-African colors in vertical bands.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap(vStripes(['#14B53A', '#FCD116', '#CE1126'])),
  },
  {
    name: 'Guinea', code: 'GN', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#CE1126', '#FCD116', '#009460'],
    symbolism: 'Pan-African red, gold, and green, here ordered red to green from hoist to fly.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(vStripes(['#CE1126', '#FCD116', '#009460'])),
  },
  {
    name: 'Ivory Coast', code: 'CI', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#F77F00', '#FFFFFF', '#009E60'],
    symbolism: 'Orange for the savanna, white for peace, green for forests.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'mixed' },
    svg: svgWrap(vStripes(['#F77F00', '#FFFFFF', '#009E60'])),
  },
  {
    name: 'Cameroon', code: 'CM', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#007A5E', '#CE1126', '#FCD116'],
    symbolism: 'Pan-African vertical bands centered with a yellow star of unity.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      vStripes(['#007A5E', '#CE1126', '#FCD116']),
      star5(450, 300, 70, '#FCD116'),
    ].join('\n')),
  },
  {
    name: 'Mongolia', code: 'MN', region: 'asia', aspect_ratio: 2 / 1,
    palette: ['#C4272F', '#015197', '#FCD116'],
    symbolism: 'A field of red and blue with the soyombo emblem near the hoist, condensing the sun, fire, and elemental balance.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      vStripes(['#C4272F', '#015197', '#C4272F']),
      // simplified soyombo
      polygon([[125, 130], [165, 195], [85, 195]], '#FCD116'),
      rect(75, 215, 100, 18, '#FCD116'),
      rect(75, 245, 100, 18, '#FCD116'),
      rect(75, 305, 100, 18, '#FCD116'),
      rect(75, 335, 100, 18, '#FCD116'),
      circle(125, 380, 18, '#FCD116'),
    ].join('\n')),
  },

  // ══ NORDIC CROSSES ════════════════════════════════════════════════════════
  {
    name: 'Sweden', code: 'SE', region: 'europe', aspect_ratio: 8 / 5,
    palette: ['#006AA7', '#FECC02'],
    symbolism: 'The yellow Nordic cross over a deep blue field, drawn from the medieval royal arms.',
    heraldic_family: 'nordic_cross',
    properties: { layout: 'cross', stripe_count: 1, color_count: 2, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'blue' },
    svg: svgWrap(nordicCross('#006AA7', '#FECC02')),
  },
  {
    name: 'Finland', code: 'FI', region: 'europe', aspect_ratio: 18 / 11,
    palette: ['#FFFFFF', '#003580'],
    symbolism: 'A blue cross of inland lakes on the snow-white field of winter.',
    heraldic_family: 'nordic_cross',
    properties: { layout: 'cross', stripe_count: 1, color_count: 2, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'white' },
    svg: svgWrap(nordicCross('#FFFFFF', '#003580')),
  },
  {
    name: 'Denmark', code: 'DK', region: 'europe', aspect_ratio: 37 / 28,
    palette: ['#C8102E', '#FFFFFF'],
    symbolism: 'The Dannebrog, said by legend to have fallen from the sky during the Battle of Lyndanisse in 1219.',
    heraldic_family: 'nordic_cross',
    properties: { layout: 'cross', stripe_count: 1, color_count: 2, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap(nordicCross('#C8102E', '#FFFFFF')),
  },
  {
    name: 'Norway', code: 'NO', region: 'europe', aspect_ratio: 22 / 16,
    palette: ['#BA0C2F', '#FFFFFF', '#00205B'],
    symbolism: 'A Nordic cross in three colors, the white fimbriation separating blue from red.',
    heraldic_family: 'nordic_cross',
    properties: { layout: 'cross', stripe_count: 1, color_count: 3, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'neutral', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap(nordicCross('#BA0C2F', '#00205B', { fimbriation: '#FFFFFF' })),
  },
  {
    name: 'Iceland', code: 'IS', region: 'europe', aspect_ratio: 25 / 18,
    palette: ['#02529C', '#FFFFFF', '#DC1E35'],
    symbolism: 'Blue for the surrounding sea, white for snow and ice, red for the volcanic fire beneath.',
    heraldic_family: 'nordic_cross',
    properties: { layout: 'cross', stripe_count: 1, color_count: 3, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'blue' },
    svg: svgWrap(nordicCross('#02529C', '#DC1E35', { fimbriation: '#FFFFFF' })),
  },

  // ══ CENTERED CROSS / SALTIRE ══════════════════════════════════════════════
  {
    name: 'Switzerland', code: 'CH', region: 'europe', aspect_ratio: 1.0,
    palette: ['#DA291C', '#FFFFFF'],
    symbolism: 'A square red flag bearing a centered white couped cross of equal-armed proportions.',
    heraldic_family: 'centered_cross',
    properties: { layout: 'cross', stripe_count: 1, color_count: 2, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap(
      [
        rect(0, 0, 600, 600, '#DA291C'),
        rect(247.5, 120, 105, 360, '#FFFFFF'),
        rect(120, 247.5, 360, 105, '#FFFFFF'),
      ].join('\n'),
      600,
      600,
    ),
  },
  {
    name: 'Greece', code: 'GR', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#0D5EAF', '#FFFFFF'],
    symbolism: 'Nine stripes for the syllables of the freedom oath, with a canton bearing a Greek cross.',
    heraldic_family: 'multi_stripe',
    properties: { layout: 'horizontal_stripes', stripe_count: 9, color_count: 2, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'blue' },
    svg: svgWrap([
      ...Array.from({ length: 9 }, (_, i) =>
        rect(0, i * (600 / 9), 900, 600 / 9 + 0.5, i % 2 === 0 ? '#0D5EAF' : '#FFFFFF'),
      ),
      rect(0, 0, 5 * (600 / 9), 5 * (600 / 9), '#0D5EAF'),
      rect((5 * (600 / 9)) / 2 - 30, 0, 60, 5 * (600 / 9), '#FFFFFF'),
      rect(0, (5 * (600 / 9)) / 2 - 30, 5 * (600 / 9), 60, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Jamaica', code: 'JM', region: 'americas', aspect_ratio: 2 / 1,
    palette: ['#009B3A', '#FFD100', '#000000'],
    symbolism: 'A diagonal saltire of yellow dividing four panels of black and green.',
    heraldic_family: 'saltire',
    properties: { layout: 'complex', stripe_count: 2, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#000000'),
      polygon([[0, 0], [450, 300], [0, 600]], '#009B3A'),
      polygon([[900, 0], [450, 300], [900, 600]], '#009B3A'),
      // Yellow saltire (X)
      polygon([[0, 0], [80, 0], [900, 540], [900, 600], [820, 600], [0, 60]], '#FFD100'),
      polygon([[820, 0], [900, 0], [900, 60], [80, 600], [0, 600], [0, 540]], '#FFD100'),
    ].join('\n')),
  },

  // ══ CHEVRON / TRIANGLE HOIST ══════════════════════════════════════════════
  {
    name: 'Czech Republic', code: 'CZ', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#FFFFFF', '#D7141A', '#11457E'],
    symbolism: 'A horizontal bicolor crossed by a blue triangular pile from the hoist.',
    heraldic_family: 'triangle_hoist',
    properties: { layout: 'chevron', stripe_count: 2, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'neutral', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      rect(0, 0, 900, 300, '#FFFFFF'),
      rect(0, 300, 900, 300, '#D7141A'),
      polygon([[0, 0], [450, 300], [0, 600]], '#11457E'),
    ].join('\n')),
  },
  {
    name: 'Cuba', code: 'CU', region: 'americas', aspect_ratio: 2 / 1,
    palette: ['#002A8F', '#FFFFFF', '#CB1515'],
    symbolism: 'Five horizontal stripes for the original provinces, with a red equilateral triangle and lone white star.',
    heraldic_family: 'triangle_hoist',
    properties: { layout: 'chevron', stripe_count: 5, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'neutral', is_symmetric: false, dominant_hue: 'blue' },
    svg: svgWrap([
      ...Array.from({ length: 5 }, (_, i) =>
        rect(0, i * 120, 900, 120.5, i % 2 === 0 ? '#002A8F' : '#FFFFFF'),
      ),
      polygon([[0, 0], [390, 300], [0, 600]], '#CB1515'),
      star5(155, 300, 55, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Sudan', code: 'SD', region: 'africa', aspect_ratio: 2 / 1,
    palette: ['#D21034', '#FFFFFF', '#000000', '#007229'],
    symbolism: 'Pan-Arab horizontal bands with a green pile from the hoist.',
    heraldic_family: 'triangle_hoist',
    properties: { layout: 'chevron', stripe_count: 3, color_count: 4, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      hStripes(['#D21034', '#FFFFFF', '#000000']),
      polygon([[0, 0], [350, 300], [0, 600]], '#007229'),
    ].join('\n')),
  },
  {
    name: 'South Africa', code: 'ZA', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#007A4D', '#FFB612', '#000000', '#FFFFFF', '#DE3831', '#002395'],
    symbolism: 'A horizontal pall in the colors of the rainbow nation, joining the past and the new democracy.',
    heraldic_family: 'pall',
    properties: { layout: 'chevron', stripe_count: 3, color_count: 6, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'complex', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#007A4D'),
      rect(0, 0, 900, 200, '#DE3831'),
      rect(0, 400, 900, 200, '#002395'),
      polygon([[0, 0], [0, 600], [370, 300]], '#000000'),
      polygon([[0, 0], [0, 600], [340, 300]], '#FFB612'),
      polygon([[0, 40], [0, 560], [295, 300]], '#FFFFFF'),
      polygon([[0, 40], [0, 560], [265, 300]], '#007A4D'),
    ].join('\n')),
  },
  {
    name: 'Philippines', code: 'PH', region: 'asia', aspect_ratio: 2 / 1,
    palette: ['#0038A8', '#CE1126', '#FFFFFF', '#FCD116'],
    symbolism: 'A white triangle of equality at the hoist bearing a sun and three stars, over fields of blue and red.',
    heraldic_family: 'triangle_hoist',
    properties: { layout: 'chevron', stripe_count: 2, color_count: 4, has_stars: true, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'complex', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      rect(0, 0, 900, 300, '#0038A8'),
      rect(0, 300, 900, 300, '#CE1126'),
      polygon([[0, 0], [519, 300], [0, 600]], '#FFFFFF'),
      circle(140, 300, 50, '#FCD116'),
      // 8 simple sun rays
      ...Array.from({ length: 8 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 8;
        const x1 = 140 + Math.cos(a) * 55;
        const y1 = 300 + Math.sin(a) * 55;
        const x2 = 140 + Math.cos(a) * 95;
        const y2 = 300 + Math.sin(a) * 95;
        return `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#FCD116" stroke-width="10"/>`;
      }),
      star5(60, 90, 18, '#FCD116'),
      star5(60, 510, 18, '#FCD116'),
      star5(440, 300, 18, '#FCD116'),
    ].join('\n')),
  },

  // ══ CIRCLE / DISC AT CENTER ═══════════════════════════════════════════════
  {
    name: 'Japan', code: 'JP', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#FFFFFF', '#BC002D'],
    symbolism: 'Hinomaru, the disc of the rising sun, on a white field of purity.',
    heraldic_family: 'centered_disc',
    properties: { layout: 'circle_center', stripe_count: 1, color_count: 2, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'white' },
    svg: svgWrap([rect(0, 0, 900, 600, '#FFFFFF'), circle(450, 300, 120, '#BC002D')].join('\n')),
  },
  {
    name: 'Bangladesh', code: 'BD', region: 'asia', aspect_ratio: 5 / 3,
    palette: ['#006A4E', '#F42A41'],
    symbolism: 'A red disc on a green field, the sun rising over the Bengal countryside.',
    heraldic_family: 'centered_disc',
    properties: { layout: 'circle_center', stripe_count: 1, color_count: 2, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'green' },
    svg: svgWrap([rect(0, 0, 900, 600, '#006A4E'), circle(420, 300, 130, '#F42A41')].join('\n')),
  },
  {
    name: 'Palau', code: 'PW', region: 'oceania', aspect_ratio: 8 / 5,
    palette: ['#4AADD6', '#FFDE00'],
    symbolism: 'A golden full moon offset on the blue Pacific.',
    heraldic_family: 'centered_disc',
    properties: { layout: 'circle_center', stripe_count: 1, color_count: 2, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'blue' },
    svg: svgWrap([rect(0, 0, 900, 600, '#4AADD6'), circle(420, 300, 130, '#FFDE00')].join('\n')),
  },
  {
    name: 'South Korea', code: 'KR', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#FFFFFF', '#CD2E3A', '#0047A0', '#000000'],
    symbolism: 'The taegeuk surrounded by four trigrams of the I Ching, signifying balance and the cosmic order.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'circle_center', stripe_count: 1, color_count: 3, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'complex', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'white' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#FFFFFF'),
      circle(450, 300, 110, '#CD2E3A'),
      circle(450, 245, 55, '#CD2E3A'),
      circle(450, 355, 55, '#0047A0'),
      `  <clipPath id="tc"><circle cx="450" cy="300" r="110"/></clipPath>`,
      `  <rect x="340" y="300" width="220" height="110" fill="#0047A0" clip-path="url(#tc)"/>`,
      circle(450, 245, 55, '#CD2E3A'),
      circle(450, 355, 55, '#0047A0'),
      rect(80, 115, 130, 18, '#000000'),
      rect(80, 143, 55, 18, '#000000'),
      rect(155, 143, 55, 18, '#000000'),
      rect(80, 171, 130, 18, '#000000'),
      rect(690, 115, 130, 18, '#000000'),
      rect(690, 143, 130, 18, '#000000'),
      rect(690, 171, 130, 18, '#000000'),
      rect(80, 407, 55, 18, '#000000'),
      rect(155, 407, 55, 18, '#000000'),
      rect(80, 435, 55, 18, '#000000'),
      rect(155, 435, 55, 18, '#000000'),
      rect(80, 463, 55, 18, '#000000'),
      rect(155, 463, 55, 18, '#000000'),
      rect(690, 407, 130, 18, '#000000'),
      rect(690, 435, 55, 18, '#000000'),
      rect(765, 435, 55, 18, '#000000'),
      rect(690, 463, 130, 18, '#000000'),
    ].join('\n')),
  },
  {
    name: 'Laos', code: 'LA', region: 'asia', aspect_ratio: 4 / 3,
    palette: ['#CE1126', '#002868', '#FFFFFF'],
    symbolism: 'A blue band of the Mekong between two stripes of red, with a white moon at center.',
    heraldic_family: 'centered_disc',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 2, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'blue' },
    svg: svgWrap([
      hStripesWeighted([
        { color: '#CE1126', weight: 1 },
        { color: '#002868', weight: 2 },
        { color: '#CE1126', weight: 1 },
      ]),
      circle(450, 300, 90, '#FFFFFF'),
    ].join('\n')),
  },

  // ══ CRESCENT / STAR-AND-CRESCENT ══════════════════════════════════════════
  {
    name: 'Turkey', code: 'TR', region: 'middle_east', aspect_ratio: 3 / 2,
    palette: ['#E30A17', '#FFFFFF'],
    symbolism: 'The crescent and star, an emblem inherited from the Ottoman naval ensign.',
    heraldic_family: 'crescent_star',
    properties: { layout: 'circle_center', stripe_count: 1, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: true, sentiment_affinity: 'negative', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#E30A17'),
      crescent(395, 300, 120, '#FFFFFF', '#E30A17', 0.27),
      star5(550, 300, 55, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Tunisia', code: 'TN', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#E70013', '#FFFFFF'],
    symbolism: 'A central white disc bearing the crescent and star of the wider Islamic world.',
    heraldic_family: 'crescent_star',
    properties: { layout: 'circle_center', stripe_count: 1, color_count: 2, has_stars: true, has_circle: true, has_cross: false, has_crescent: true, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#E70013'),
      circle(450, 300, 130, '#FFFFFF'),
      crescent(450, 300, 80, '#E70013', '#FFFFFF', 0.32),
      star5(478, 300, 36, '#E70013'),
    ].join('\n')),
  },
  {
    name: 'Algeria', code: 'DZ', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#006633', '#FFFFFF', '#D21034'],
    symbolism: 'A green and white field divided vertically, with a red crescent and star at center.',
    heraldic_family: 'crescent_star',
    properties: { layout: 'vertical_stripes', stripe_count: 2, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: true, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'green' },
    svg: svgWrap([
      rect(0, 0, 450, 600, '#006633'),
      rect(450, 0, 450, 600, '#FFFFFF'),
      crescent(440, 300, 110, '#D21034', '#FFFFFF', 0.32),
      star5(485, 300, 50, '#D21034'),
    ].join('\n')),
  },
  {
    name: 'Pakistan', code: 'PK', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#01411C', '#FFFFFF'],
    symbolism: 'A white hoist band for minorities beside the green of Islam, with crescent and star at the fly.',
    heraldic_family: 'crescent_star',
    properties: { layout: 'complex', stripe_count: 1, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: true, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'green' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#01411C'),
      rect(0, 0, 225, 600, '#FFFFFF'),
      crescent(520, 300, 110, '#FFFFFF', '#01411C', 0.30),
      star5(620, 250, 38, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Singapore', code: 'SG', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#EF3340', '#FFFFFF'],
    symbolism: 'A red half for brotherhood, white for purity, with a crescent of a young nation and five stars.',
    heraldic_family: 'crescent_star',
    properties: { layout: 'horizontal_stripes', stripe_count: 2, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: true, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 900, 300, '#EF3340'),
      rect(0, 300, 900, 300, '#FFFFFF'),
      crescent(180, 150, 90, '#FFFFFF', '#EF3340', 0.32),
      ...[
        [275, 95], [355, 95], [220, 165], [310, 165], [400, 165],
      ].map(([x, y]) => star5(x as number, y as number, 22, '#FFFFFF')),
    ].join('\n')),
  },
  {
    name: 'Maldives', code: 'MV', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#D21034', '#007E3A', '#FFFFFF'],
    symbolism: 'A red border surrounding a green panel with a white crescent.',
    heraldic_family: 'crescent_star',
    properties: { layout: 'complex', stripe_count: 1, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: true, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#D21034'),
      rect(120, 105, 660, 390, '#007E3A'),
      crescent(450, 300, 110, '#FFFFFF', '#007E3A', 0.32),
    ].join('\n')),
  },

  // ══ ARAB GULF / TRIANGLE-AT-HOIST WITH BANDS ══════════════════════════════
  {
    name: 'United Arab Emirates', code: 'AE', region: 'middle_east', aspect_ratio: 2 / 1,
    palette: ['#FF0000', '#00732F', '#FFFFFF', '#000000'],
    symbolism: 'The four Pan-Arab colors, with a red vertical band at the hoist beside green, white, and black.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 4, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      hStripes(['#00732F', '#FFFFFF', '#000000']),
      rect(0, 0, 225, 600, '#FF0000'),
    ].join('\n')),
  },
  {
    name: 'Jordan', code: 'JO', region: 'middle_east', aspect_ratio: 2 / 1,
    palette: ['#000000', '#FFFFFF', '#007A3D', '#CE1126'],
    symbolism: 'Three Pan-Arab horizontal bands with a red triangle of the Hashemite revolt and a seven-pointed star.',
    heraldic_family: 'triangle_hoist',
    properties: { layout: 'chevron', stripe_count: 3, color_count: 4, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      hStripes(['#000000', '#FFFFFF', '#007A3D']),
      polygon([[0, 0], [375, 300], [0, 600]], '#CE1126'),
      star5(110, 300, 38, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Lebanon', code: 'LB', region: 'middle_east', aspect_ratio: 3 / 2,
    palette: ['#ED1C24', '#FFFFFF', '#00A651'],
    symbolism: 'Two red bands of sacrifice surround a white middle bearing the cedar of Lebanon.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap([
      hStripesWeighted([
        { color: '#ED1C24', weight: 1 },
        { color: '#FFFFFF', weight: 2 },
        { color: '#ED1C24', weight: 1 },
      ]),
      // Cedar tree (simplified as a stack of triangles)
      polygon([[450, 200], [380, 280], [520, 280]], '#00A651'),
      polygon([[450, 250], [360, 340], [540, 340]], '#00A651'),
      polygon([[450, 305], [340, 400], [560, 400]], '#00A651'),
      rect(440, 395, 20, 30, '#5C2E0F'),
    ].join('\n')),
  },
  {
    name: 'Israel', code: 'IL', region: 'middle_east', aspect_ratio: 11 / 8,
    palette: ['#FFFFFF', '#0038B8'],
    symbolism: 'The Magen David between two horizontal blue bands recalling the prayer shawl.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'circle_center', stripe_count: 1, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'white' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#FFFFFF'),
      rect(0, 90, 900, 70, '#0038B8'),
      rect(0, 440, 900, 70, '#0038B8'),
      starOfDavid(450, 300, 100, '#0038B8', 22),
    ].join('\n')),
  },

  // ══ COMPLEX / CHARGES ═════════════════════════════════════════════════════
  {
    name: 'Chile', code: 'CL', region: 'americas', aspect_ratio: 3 / 2,
    palette: ['#FFFFFF', '#D52B1E', '#0039A6'],
    symbolism: 'A blue canton with a single white star above a white and red field.',
    heraldic_family: 'canton_with_charge',
    properties: { layout: 'horizontal_stripes', stripe_count: 2, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 900, 300, '#FFFFFF'),
      rect(0, 300, 900, 300, '#D52B1E'),
      rect(0, 0, 300, 300, '#0039A6'),
      star5(150, 150, 60, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'China', code: 'CN', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#DE2910', '#FFDE00'],
    symbolism: 'A large golden star of the Communist Party led by four lesser stars representing the unified people.',
    heraldic_family: 'canton_with_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'negative', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#DE2910'),
      star5(195, 165, 60, '#FFDE00'),
      star5(315, 90, 22, '#FFDE00'),
      star5(360, 135, 22, '#FFDE00'),
      star5(360, 195, 22, '#FFDE00'),
      star5(315, 240, 22, '#FFDE00'),
    ].join('\n')),
  },
  {
    name: 'Vietnam', code: 'VN', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#DA251D', '#FFFF00'],
    symbolism: 'A single golden star on a field of red.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'negative', complexity: 'simple', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([rect(0, 0, 900, 600, '#DA251D'), star5(450, 300, 100, '#FFFF00')].join('\n')),
  },
  {
    name: 'Somalia', code: 'SO', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#4189DD', '#FFFFFF'],
    symbolism: 'A single white star on a United Nations blue field.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'simple', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'blue' },
    svg: svgWrap([rect(0, 0, 900, 600, '#4189DD'), star5(450, 300, 100, '#FFFFFF')].join('\n')),
  },
  {
    name: 'Morocco', code: 'MA', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#C1272D', '#006233'],
    symbolism: 'The interlaced green seal of Solomon centered on a deep red field.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 2, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'simple', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([rect(0, 0, 900, 600, '#C1272D'), star5(450, 300, 100, '#006233')].join('\n')),
  },
  {
    name: 'Ethiopia', code: 'ET', region: 'africa', aspect_ratio: 2 / 1,
    palette: ['#078930', '#FCDD09', '#DA121A', '#0F47AF'],
    symbolism: 'Pan-African green, gold, and red with the central blue disc bearing the Ethiopian sun.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: true, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'green' },
    svg: svgWrap([
      hStripes(['#078930', '#FCDD09', '#DA121A']),
      circle(450, 300, 100, '#0F47AF'),
      star5(450, 300, 70, '#FCDD09'),
    ].join('\n')),
  },
  {
    name: 'Ghana', code: 'GH', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#CE1126', '#FCD116', '#006B3F', '#000000'],
    symbolism: 'Pan-African horizontal bands with a black star, the lodestar of African freedom.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      hStripes(['#CE1126', '#FCD116', '#006B3F']),
      star5(450, 300, 70, '#000000'),
    ].join('\n')),
  },
  {
    name: 'India', code: 'IN', region: 'asia', aspect_ratio: 3 / 2,
    palette: ['#FF9933', '#FFFFFF', '#138808', '#000080'],
    symbolism: 'Saffron of courage, white of truth, green of the land, with the Ashoka chakra in navy at the heart.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      hStripes(['#FF9933', '#FFFFFF', '#138808']),
      `  <circle cx="450" cy="300" r="75" fill="none" stroke="#000080" stroke-width="6"/>`,
      circle(450, 300, 12, '#000080'),
      ...Array.from({ length: 24 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 24;
        const x1 = 450 + Math.cos(a) * 12;
        const y1 = 300 + Math.sin(a) * 12;
        const x2 = 450 + Math.cos(a) * 74;
        const y2 = 300 + Math.sin(a) * 74;
        return `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#000080" stroke-width="3"/>`;
      }),
    ].join('\n')),
  },
  {
    name: 'Argentina', code: 'AR', region: 'americas', aspect_ratio: 5 / 4,
    palette: ['#74ACDF', '#FFFFFF', '#F6B40E'],
    symbolism: 'Sky-blue and white with the Sol de Mayo at the heart, the radiant sun of revolution.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 2, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'blue' },
    svg: svgWrap([
      hStripes(['#74ACDF', '#FFFFFF', '#74ACDF']),
      circle(450, 300, 60, '#F6B40E'),
      ...Array.from({ length: 16 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 16;
        const inner = 62,
          outer = i % 2 === 0 ? 100 : 85;
        const x1 = 450 + Math.cos(a) * inner;
        const y1 = 300 + Math.sin(a) * inner;
        const x2 = 450 + Math.cos(a) * outer;
        const y2 = 300 + Math.sin(a) * outer;
        return `  <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#F6B40E" stroke-width="${i % 2 === 0 ? 8 : 5}"/>`;
      }),
    ].join('\n')),
  },
  {
    name: 'Canada', code: 'CA', region: 'americas', aspect_ratio: 2 / 1,
    palette: ['#FF0000', '#FFFFFF'],
    symbolism: 'The eleven-pointed maple leaf at the heart of red and white pales.',
    heraldic_family: 'tricolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 3, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 225, 600, '#FF0000'),
      rect(225, 0, 450, 600, '#FFFFFF'),
      rect(675, 0, 225, 600, '#FF0000'),
      polygon(
        [
          [450, 115], [463, 160], [510, 160], [472, 185], [485, 230],
          [450, 205], [415, 230], [428, 185], [390, 160], [437, 160],
        ],
        '#FF0000',
      ),
      rect(435, 225, 30, 100, '#FF0000'),
    ].join('\n')),
  },
  {
    name: 'Spain', code: 'ES', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#AA151B', '#F1BF00'],
    symbolism: 'A horizontal field of red and gold, the gualda of the Hispanic monarchy.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'yellow' },
    svg: svgWrap([
      hStripesWeighted([
        { color: '#AA151B', weight: 1 },
        { color: '#F1BF00', weight: 2 },
        { color: '#AA151B', weight: 1 },
      ]),
      rect(280, 175, 22, 250, '#AA151B'),
      rect(350, 175, 22, 250, '#AA151B'),
    ].join('\n')),
  },
  {
    name: 'Portugal', code: 'PT', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#006600', '#FF0000', '#FFE500'],
    symbolism: 'A bicolor of green and red bearing the armillary sphere of seafaring discovery.',
    heraldic_family: 'bicolor_vertical',
    properties: { layout: 'vertical_stripes', stripe_count: 2, color_count: 3, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 360, 600, '#006600'),
      rect(360, 0, 540, 600, '#FF0000'),
      circle(360, 300, 90, '#FFE500', { stroke: '#000000', sw: 6 }),
      circle(360, 300, 60, '#FFFFFF', { stroke: '#000000', sw: 4 }),
    ].join('\n')),
  },
  {
    name: 'United Kingdom', code: 'GB', region: 'europe', aspect_ratio: 2 / 1,
    palette: ['#012169', '#FFFFFF', '#C8102E'],
    symbolism: 'The Union Jack, combining the crosses of Saint George, Saint Andrew, and Saint Patrick.',
    heraldic_family: 'saltire',
    properties: { layout: 'complex', stripe_count: 1, color_count: 3, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'complex', color_warmth: 'cool', is_symmetric: true, dominant_hue: 'blue' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#012169'),
      // White diagonals (Andrew + simplified)
      `  <path d="M0,0 L900,600 M900,0 L0,600" stroke="#FFFFFF" stroke-width="120"/>`,
      // Red diagonals (Patrick), thinner offset
      `  <path d="M0,0 L900,600" stroke="#C8102E" stroke-width="40"/>`,
      `  <path d="M900,0 L0,600" stroke="#C8102E" stroke-width="40"/>`,
      // White cross (George background)
      rect(0, 240, 900, 120, '#FFFFFF'),
      rect(390, 0, 120, 600, '#FFFFFF'),
      // Red cross (George)
      rect(0, 260, 900, 80, '#C8102E'),
      rect(410, 0, 80, 600, '#C8102E'),
    ].join('\n')),
  },
  {
    name: 'Australia', code: 'AU', region: 'oceania', aspect_ratio: 2 / 1,
    palette: ['#012169', '#FFFFFF', '#C8102E'],
    symbolism: 'The Union Jack canton with the Commonwealth Star and Southern Cross on a blue field.',
    heraldic_family: 'canton_with_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 3, has_stars: true, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'complex', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'blue' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#012169'),
      // Canton (top-left quarter scaled)
      rect(0, 0, 450, 300, '#012169'),
      `  <path d="M0,0 L450,300 M450,0 L0,300" stroke="#FFFFFF" stroke-width="60" clip-path="inset(0 0 0 0)"/>`,
      `  <path d="M0,0 L450,300" stroke="#C8102E" stroke-width="20"/>`,
      `  <path d="M450,0 L0,300" stroke="#C8102E" stroke-width="20"/>`,
      rect(0, 120, 450, 60, '#FFFFFF'),
      rect(195, 0, 60, 300, '#FFFFFF'),
      rect(0, 130, 450, 40, '#C8102E'),
      rect(205, 0, 40, 300, '#C8102E'),
      // Commonwealth star (below canton)
      star5(225, 450, 60, '#FFFFFF'),
      // Southern Cross
      star5(680, 200, 35, '#FFFFFF'),
      star5(750, 320, 40, '#FFFFFF'),
      star5(620, 380, 30, '#FFFFFF'),
      star5(720, 470, 25, '#FFFFFF'),
      star5(800, 380, 22, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'New Zealand', code: 'NZ', region: 'oceania', aspect_ratio: 2 / 1,
    palette: ['#012169', '#FFFFFF', '#C8102E'],
    symbolism: 'The Union Jack canton with four red stars of the Southern Cross.',
    heraldic_family: 'canton_with_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 3, has_stars: true, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'complex', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'blue' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#012169'),
      rect(0, 0, 450, 300, '#012169'),
      `  <path d="M0,0 L450,300 M450,0 L0,300" stroke="#FFFFFF" stroke-width="60"/>`,
      `  <path d="M0,0 L450,300" stroke="#C8102E" stroke-width="20"/>`,
      `  <path d="M450,0 L0,300" stroke="#C8102E" stroke-width="20"/>`,
      rect(0, 120, 450, 60, '#FFFFFF'),
      rect(195, 0, 60, 300, '#FFFFFF'),
      rect(0, 130, 450, 40, '#C8102E'),
      rect(205, 0, 40, 300, '#C8102E'),
      // 4 Southern Cross stars (red, white outline)
      ...[
        [680, 200], [780, 290], [620, 380], [720, 460],
      ].map(([x, y]) => `  <g><circle cx="${x}" cy="${y}" r="38" fill="#FFFFFF"/>${star5(x as number, y as number, 28, '#C8102E')}</g>`),
    ].join('\n')),
  },
  {
    name: 'Brazil', code: 'BR', region: 'americas', aspect_ratio: 10 / 7,
    palette: ['#009C3B', '#FEDF00', '#002776', '#FFFFFF'],
    symbolism: 'A green field, golden rhombus, and starry blue sky bearing the motto Order and Progress.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 4, has_stars: true, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'complex', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'green' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#009C3B'),
      polygon([[450, 50], [855, 300], [450, 550], [45, 300]], '#FEDF00'),
      circle(450, 300, 145, '#002776'),
      `  <path d="M 330 260 Q 450 220 570 260 L 570 280 Q 450 240 330 280 Z" fill="#FFFFFF"/>`,
      star5(355, 270, 15, '#FFFFFF'),
      star5(395, 252, 13, '#FFFFFF'),
      star5(437, 245, 14, '#FFFFFF'),
      star5(479, 248, 13, '#FFFFFF'),
      star5(519, 260, 15, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'United States', code: 'US', region: 'americas', aspect_ratio: 19 / 10,
    palette: ['#B22234', '#FFFFFF', '#3C3B6E'],
    symbolism: 'Thirteen stripes for the founding colonies and fifty stars for the present states.',
    heraldic_family: 'canton_with_charge',
    properties: { layout: 'complex', stripe_count: 13, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'positive', complexity: 'complex', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      ...Array.from({ length: 13 }, (_, i) => {
        const y = i * (600 / 13);
        const h = 600 / 13 + 0.5;
        return rect(0, y, 900, h, i % 2 === 0 ? '#B22234' : '#FFFFFF');
      }),
      rect(0, 0, 360, (7 * 600) / 13, '#3C3B6E'),
      ...Array.from({ length: 5 }, (_, row) =>
        Array.from({ length: 6 }, (_, col) => star5(30 + col * 50, 20 + row * 42, 14, '#FFFFFF')),
      ).flat(),
    ].join('\n')),
  },
  {
    name: 'Malaysia', code: 'MY', region: 'asia', aspect_ratio: 2 / 1,
    palette: ['#CC0001', '#FFFFFF', '#010066', '#FFCC00'],
    symbolism: 'Fourteen stripes for the federation, with a blue canton bearing the crescent and fourteen-pointed star.',
    heraldic_family: 'canton_with_charge',
    properties: { layout: 'horizontal_stripes', stripe_count: 14, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: true, sentiment_affinity: 'positive', complexity: 'complex', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      ...Array.from({ length: 14 }, (_, i) =>
        rect(0, i * (600 / 14), 900, 600 / 14 + 0.5, i % 2 === 0 ? '#CC0001' : '#FFFFFF'),
      ),
      rect(0, 0, 360, (7 * 600) / 14, '#010066'),
      circle(155, 145, 68, '#FFCC00'),
      circle(178, 133, 55, '#010066'),
      star5(232, 140, 32, '#FFCC00'),
    ].join('\n')),
  },
  {
    name: 'Saudi Arabia', code: 'SA', region: 'middle_east', aspect_ratio: 3 / 2,
    palette: ['#006C35', '#FFFFFF'],
    symbolism: 'A green field bearing the shahada and a white sword in token of justice.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'complex', stripe_count: 1, color_count: 2, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'green' },
    svg: svgWrap([
      rect(0, 0, 900, 600, '#006C35'),
      // simplified shahada (decorative wave)
      `  <path d="M 130 240 Q 250 200 370 240 T 610 240 T 770 240" stroke="#FFFFFF" stroke-width="14" fill="none"/>`,
      // sword
      rect(140, 380, 600, 12, '#FFFFFF'),
      polygon([[740, 360], [780, 386], [740, 412]], '#FFFFFF'),
      rect(120, 374, 18, 24, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Kenya', code: 'KE', region: 'africa', aspect_ratio: 3 / 2,
    palette: ['#000000', '#BB0000', '#006600', '#FFFFFF'],
    symbolism: 'Three horizontal bands fimbriated white, with a Maasai shield and crossed spears at center.',
    heraldic_family: 'centered_charge',
    properties: { layout: 'horizontal_stripes', stripe_count: 5, color_count: 4, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'complex', color_warmth: 'warm', is_symmetric: true, dominant_hue: 'mixed' },
    svg: svgWrap([
      hStripesWeighted([
        { color: '#000000', weight: 4 },
        { color: '#FFFFFF', weight: 1 },
        { color: '#BB0000', weight: 4 },
        { color: '#FFFFFF', weight: 1 },
        { color: '#006600', weight: 4 },
      ]),
      // crossed spears
      rect(290, 230, 320, 8, '#000000'),
      `  <line x1="290" y1="230" x2="610" y2="370" stroke="#000000" stroke-width="8"/>`,
      `  <line x1="290" y1="370" x2="610" y2="230" stroke="#000000" stroke-width="8"/>`,
      // Maasai shield (simplified ellipse)
      `  <ellipse cx="450" cy="300" rx="80" ry="120" fill="#BB0000" stroke="#000000" stroke-width="6"/>`,
      `  <ellipse cx="450" cy="300" rx="55" ry="95" fill="#FFFFFF"/>`,
      `  <ellipse cx="450" cy="300" rx="35" ry="75" fill="#000000"/>`,
    ].join('\n')),
  },
  {
    name: 'Slovakia', code: 'SK', region: 'europe', aspect_ratio: 3 / 2,
    palette: ['#FFFFFF', '#0B4EA2', '#EE1C25'],
    symbolism: 'The Pan-Slavic tricolor charged with the double cross of Cyril and Methodius.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 4, has_stars: false, has_circle: false, has_cross: true, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      hStripes(['#FFFFFF', '#0B4EA2', '#EE1C25']),
      // Shield with double cross at hoist
      `  <path d="M 110 165 L 270 165 L 270 320 Q 270 420 190 460 Q 110 420 110 320 Z" fill="#EE1C25" stroke="#FFFFFF" stroke-width="6"/>`,
      rect(180, 215, 20, 180, '#FFFFFF'),
      rect(140, 245, 100, 18, '#FFFFFF'),
      rect(125, 295, 130, 18, '#FFFFFF'),
    ].join('\n')),
  },
  {
    name: 'Croatia', code: 'HR', region: 'europe', aspect_ratio: 2 / 1,
    palette: ['#FF0000', '#FFFFFF', '#171796'],
    symbolism: 'A Pan-Slavic tricolor charged with the checkered shield of Croatia at the heart.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: false, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'mixed' },
    svg: svgWrap([
      hStripes(['#FF0000', '#FFFFFF', '#171796']),
      // Checkered shield (simplified 5x5)
      ...Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 5 }, (_, c) =>
          rect(395 + c * 22, 210 + r * 22, 22, 22, (r + c) % 2 === 0 ? '#FF0000' : '#FFFFFF'),
        ),
      ).flat(),
      `  <rect x="395" y="210" width="110" height="110" fill="none" stroke="#FFFFFF" stroke-width="4"/>`,
    ].join('\n')),
  },
  {
    name: 'Slovenia', code: 'SI', region: 'europe', aspect_ratio: 2 / 1,
    palette: ['#FFFFFF', '#0000A4', '#FF0000'],
    symbolism: 'A Pan-Slavic tricolor with the coat of arms displayed near the hoist of the white band.',
    heraldic_family: 'tricolor_horizontal',
    properties: { layout: 'horizontal_stripes', stripe_count: 3, color_count: 3, has_stars: true, has_circle: false, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'cool', is_symmetric: false, dominant_hue: 'white' },
    svg: svgWrap([
      hStripes(['#FFFFFF', '#0000A4', '#FF0000']),
      // simplified shield in upper-hoist
      `  <path d="M 100 100 L 220 100 L 220 220 Q 220 290 160 320 Q 100 290 100 220 Z" fill="#0000A4" stroke="#FFFFFF" stroke-width="4"/>`,
      // mountain (Triglav) simplified
      polygon([[160, 140], [195, 200], [125, 200]], '#FFFFFF'),
      rect(120, 200, 80, 8, '#FFFFFF'),
      rect(120, 215, 80, 8, '#FFFFFF'),
      // 3 stars
      star5(135, 110, 8, '#FFE000'),
      star5(160, 100, 8, '#FFE000'),
      star5(185, 110, 8, '#FFE000'),
    ].join('\n')),
  },
  {
    name: 'Greenland', code: 'GL', region: 'americas', aspect_ratio: 18 / 12,
    palette: ['#FFFFFF', '#D00C33'],
    symbolism: 'A horizontal bicolor with an inverted disc, signifying the icecap and the midnight sun.',
    heraldic_family: 'centered_disc',
    properties: { layout: 'horizontal_stripes', stripe_count: 2, color_count: 2, has_stars: false, has_circle: true, has_cross: false, has_crescent: false, sentiment_affinity: 'neutral', complexity: 'medium', color_warmth: 'warm', is_symmetric: false, dominant_hue: 'red' },
    svg: svgWrap([
      rect(0, 0, 900, 300, '#FFFFFF'),
      rect(0, 300, 900, 300, '#D00C33'),
      circle(360, 300, 130, '#D00C33'),
      // "lower half white" effect by drawing white half-disc above center
      `  <path d="M 230 300 A 130 130 0 0 1 490 300 Z" fill="#D00C33"/>`,
      `  <path d="M 230 300 A 130 130 0 0 0 490 300 Z" fill="#FFFFFF"/>`,
    ].join('\n')),
  },
];

// ── Convenience lookups ──────────────────────────────────────────────────────

export function findCountryByCode(code: string): CountryFlag | undefined {
  const upper = code.toUpperCase();
  return COUNTRY_FLAGS.find((c) => c.code === upper);
}

export function flagsByRegion(region: Region): CountryFlag[] {
  return COUNTRY_FLAGS.filter((c) => c.region === region);
}

export function flagsByFamily(family: HeraldicFamily): CountryFlag[] {
  return COUNTRY_FLAGS.filter((c) => c.heraldic_family === family);
}
