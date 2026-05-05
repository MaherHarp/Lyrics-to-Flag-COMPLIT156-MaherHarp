/**
 * Heraldry primitives.
 *
 * A small structural toolkit for describing and rendering heraldic shields.
 * The renderer here is intentionally simple. It exists so that the rest of
 * the application has a typed vocabulary for tinctures, ordinaries, and
 * charges, and so that future work can expand the engine without rewriting
 * its data model.
 */

export type Tincture =
  | 'Or'        // gold / yellow
  | 'Argent'    // silver / white
  | 'Azure'     // blue
  | 'Gules'     // red
  | 'Sable'     // black
  | 'Vert'      // green
  | 'Tenné'     // orange
  | 'Purpure';  // purple

export const TINCTURE_FILL: Record<Tincture, string> = {
  Or: '#F1BF00',
  Argent: '#FFFFFF',
  Azure: '#003DA5',
  Gules: '#CE1126',
  Sable: '#000000',
  Vert: '#00853F',
  Tenné: '#D67E00',
  Purpure: '#6B2D7B',
};

export type ShieldShape = 'heater' | 'rounded' | 'pointed' | 'french';

export type Division =
  | { kind: 'plain'; tincture: Tincture }
  | { kind: 'per_fess'; chief: Tincture; base: Tincture }
  | { kind: 'per_pale'; dexter: Tincture; sinister: Tincture }
  | { kind: 'quarterly'; q1: Tincture; q2: Tincture; q3: Tincture; q4: Tincture }
  | { kind: 'per_bend'; upper: Tincture; lower: Tincture }
  | { kind: 'per_saltire'; chief: Tincture; dexter: Tincture; sinister: Tincture; base: Tincture };

export type Charge =
  | { kind: 'mullet'; tincture: Tincture; cx: number; cy: number; r: number }
  | { kind: 'roundel'; tincture: Tincture; cx: number; cy: number; r: number }
  | { kind: 'cross_couped'; tincture: Tincture }
  | { kind: 'fleur_de_lis'; tincture: Tincture; cx: number; cy: number; size: number }
  | { kind: 'lion_passant'; tincture: Tincture; cx: number; cy: number; size: number }
  | { kind: 'eagle_displayed'; tincture: Tincture; cx: number; cy: number; size: number };

export type Shield = {
  shape: ShieldShape;
  field: Division;
  charges: Charge[];
};

const SHIELD_W = 600;
const SHIELD_H = 720;

function shieldPath(shape: ShieldShape): string {
  switch (shape) {
    case 'rounded':
      return `M 0 0 H ${SHIELD_W} V 360 Q ${SHIELD_W} ${SHIELD_H} ${SHIELD_W / 2} ${SHIELD_H} Q 0 ${SHIELD_H} 0 360 Z`;
    case 'pointed':
      return `M 0 0 H ${SHIELD_W} V 380 L ${SHIELD_W / 2} ${SHIELD_H} L 0 380 Z`;
    case 'french':
      return `M 30 0 H ${SHIELD_W - 30} Q ${SHIELD_W} 0 ${SHIELD_W} 30 V 380 Q ${SHIELD_W} ${SHIELD_H} ${SHIELD_W / 2} ${SHIELD_H} Q 0 ${SHIELD_H} 0 380 V 30 Q 0 0 30 0 Z`;
    case 'heater':
    default:
      return `M 0 0 H ${SHIELD_W} V 360 Q ${SHIELD_W} ${SHIELD_H} ${SHIELD_W / 2} ${SHIELD_H} Q 0 ${SHIELD_H} 0 360 V 0 Z`;
  }
}

function renderField(d: Division): string {
  const T = TINCTURE_FILL;
  switch (d.kind) {
    case 'plain':
      return `<rect x="0" y="0" width="${SHIELD_W}" height="${SHIELD_H}" fill="${T[d.tincture]}"/>`;
    case 'per_fess':
      return (
        `<rect x="0" y="0" width="${SHIELD_W}" height="${SHIELD_H / 2}" fill="${T[d.chief]}"/>` +
        `<rect x="0" y="${SHIELD_H / 2}" width="${SHIELD_W}" height="${SHIELD_H / 2}" fill="${T[d.base]}"/>`
      );
    case 'per_pale':
      return (
        `<rect x="0" y="0" width="${SHIELD_W / 2}" height="${SHIELD_H}" fill="${T[d.dexter]}"/>` +
        `<rect x="${SHIELD_W / 2}" y="0" width="${SHIELD_W / 2}" height="${SHIELD_H}" fill="${T[d.sinister]}"/>`
      );
    case 'quarterly':
      return (
        `<rect x="0" y="0" width="${SHIELD_W / 2}" height="${SHIELD_H / 2}" fill="${T[d.q1]}"/>` +
        `<rect x="${SHIELD_W / 2}" y="0" width="${SHIELD_W / 2}" height="${SHIELD_H / 2}" fill="${T[d.q2]}"/>` +
        `<rect x="0" y="${SHIELD_H / 2}" width="${SHIELD_W / 2}" height="${SHIELD_H / 2}" fill="${T[d.q3]}"/>` +
        `<rect x="${SHIELD_W / 2}" y="${SHIELD_H / 2}" width="${SHIELD_W / 2}" height="${SHIELD_H / 2}" fill="${T[d.q4]}"/>`
      );
    case 'per_bend':
      return (
        `<rect x="0" y="0" width="${SHIELD_W}" height="${SHIELD_H}" fill="${T[d.lower]}"/>` +
        `<polygon points="0,0 ${SHIELD_W},0 0,${SHIELD_H}" fill="${T[d.upper]}"/>`
      );
    case 'per_saltire':
      return (
        `<rect x="0" y="0" width="${SHIELD_W}" height="${SHIELD_H}" fill="${T[d.chief]}"/>` +
        `<polygon points="${SHIELD_W / 2},0 ${SHIELD_W},${SHIELD_H / 2} ${SHIELD_W / 2},${SHIELD_H} 0,${SHIELD_H / 2}" fill="${T[d.chief]}"/>` +
        `<polygon points="0,0 ${SHIELD_W / 2},${SHIELD_H / 2} 0,${SHIELD_H}" fill="${T[d.dexter]}"/>` +
        `<polygon points="${SHIELD_W},0 ${SHIELD_W / 2},${SHIELD_H / 2} ${SHIELD_W},${SHIELD_H}" fill="${T[d.sinister]}"/>` +
        `<polygon points="0,${SHIELD_H} ${SHIELD_W / 2},${SHIELD_H / 2} ${SHIELD_W},${SHIELD_H}" fill="${T[d.base]}"/>`
      );
  }
}

function star5(cx: number, cy: number, r: number, fill: string): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.382;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${(cx + Math.cos(a) * radius).toFixed(2)},${(cy + Math.sin(a) * radius).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

function renderCharge(c: Charge): string {
  const T = TINCTURE_FILL;
  switch (c.kind) {
    case 'mullet':
      return star5(c.cx, c.cy, c.r, T[c.tincture]);
    case 'roundel':
      return `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}" fill="${T[c.tincture]}"/>`;
    case 'cross_couped': {
      const cx = SHIELD_W / 2;
      const cy = SHIELD_H / 2;
      const arm = 220;
      const thick = 90;
      return (
        `<rect x="${cx - thick / 2}" y="${cy - arm / 2}" width="${thick}" height="${arm}" fill="${T[c.tincture]}"/>` +
        `<rect x="${cx - arm / 2}" y="${cy - thick / 2}" width="${arm}" height="${thick}" fill="${T[c.tincture]}"/>`
      );
    }
    case 'fleur_de_lis': {
      const f = T[c.tincture];
      const x = c.cx;
      const y = c.cy;
      const s = c.size;
      return (
        `<path d="M ${x} ${y - s} Q ${x - s * 0.4} ${y - s * 0.5} ${x - s * 0.6} ${y} Q ${x - s * 0.7} ${y + s * 0.3} ${x} ${y + s * 0.4} Q ${x + s * 0.7} ${y + s * 0.3} ${x + s * 0.6} ${y} Q ${x + s * 0.4} ${y - s * 0.5} ${x} ${y - s} Z" fill="${f}"/>` +
        `<rect x="${x - s * 0.5}" y="${y + s * 0.2}" width="${s}" height="${s * 0.18}" fill="${f}"/>`
      );
    }
    case 'lion_passant': {
      const f = T[c.tincture];
      const x = c.cx;
      const y = c.cy;
      const s = c.size;
      return (
        `<g fill="${f}">` +
        `<ellipse cx="${x}" cy="${y}" rx="${s * 0.85}" ry="${s * 0.42}"/>` +
        `<circle cx="${x - s * 0.7}" cy="${y - s * 0.1}" r="${s * 0.35}"/>` +
        `<rect x="${x - s * 0.85}" y="${y + s * 0.2}" width="${s * 0.18}" height="${s * 0.55}"/>` +
        `<rect x="${x - s * 0.4}" y="${y + s * 0.2}" width="${s * 0.18}" height="${s * 0.55}"/>` +
        `<rect x="${x + s * 0.05}" y="${y + s * 0.2}" width="${s * 0.18}" height="${s * 0.55}"/>` +
        `<rect x="${x + s * 0.5}" y="${y + s * 0.2}" width="${s * 0.18}" height="${s * 0.55}"/>` +
        `<path d="M ${x + s * 0.85} ${y - s * 0.1} Q ${x + s * 1.2} ${y - s * 0.4} ${x + s * 1.0} ${y - s * 0.55}" stroke="${f}" stroke-width="${s * 0.12}" fill="none"/>` +
        `</g>`
      );
    }
    case 'eagle_displayed': {
      const f = T[c.tincture];
      const x = c.cx;
      const y = c.cy;
      const s = c.size;
      return (
        `<g fill="${f}">` +
        `<circle cx="${x}" cy="${y - s * 0.5}" r="${s * 0.2}"/>` +
        `<polygon points="${x - s},${y} ${x},${y - s * 0.3} ${x + s},${y} ${x + s * 0.6},${y + s * 0.5} ${x},${y + s * 0.3} ${x - s * 0.6},${y + s * 0.5}"/>` +
        `<rect x="${x - s * 0.05}" y="${y + s * 0.3}" width="${s * 0.1}" height="${s * 0.5}"/>` +
        `</g>`
      );
    }
  }
}

export function renderShieldSvg(shield: Shield): string {
  const path = shieldPath(shield.shape);
  const field = renderField(shield.field);
  const charges = shield.charges.map(renderCharge).join('');
  const id = 'shield_clip';
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SHIELD_W} ${SHIELD_H}" role="img" aria-label="Heraldic shield">\n` +
    `  <defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs>\n` +
    `  <g clip-path="url(#${id})">${field}${charges}</g>\n` +
    `  <path d="${path}" fill="none" stroke="#000000" stroke-width="6"/>\n` +
    `</svg>`
  );
}
