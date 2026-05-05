import type { FlagSpec } from './flag.js';

const W = 900;
const H = 600;

function rect(x: number, y: number, w: number, h: number, fill: string): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
}

function circle(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
}

function polygon(points: Array<[number, number]>, fill: string): string {
  const pts = points.map(([x, y]) => `${x},${y}`).join(' ');
  return `<polygon points="${pts}" fill="${fill}"/>`;
}

function starPoints(cx: number, cy: number, outerR: number, innerR: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  const spikes = 5;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI / spikes) * i - Math.PI / 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function renderLayout(spec: FlagSpec): string {
  const p = spec.palette;
  const type = spec.layout.type;
  const n = Math.max(1, spec.layout.stripe_count);

  if (type === 'horizontal_stripes') {
    const stripeH = H / n;
    return Array.from({ length: n }, (_, i) =>
      rect(0, i * stripeH, W, stripeH + 0.5, p[i % p.length] ?? '#000'),
    ).join('');
  }

  if (type === 'vertical_stripes') {
    const stripeW = W / n;
    return Array.from({ length: n }, (_, i) =>
      rect(i * stripeW, 0, stripeW + 0.5, H, p[i % p.length] ?? '#000'),
    ).join('');
  }

  if (type === 'cross') {
    const bg = p[0] ?? '#003049';
    const cross = p[1] ?? '#FFFFFF';
    const bandW = 180;
    const bandH = 180;
    return (
      rect(0, 0, W, H, bg) +
      rect(W / 2 - bandW / 2, 0, bandW, H, cross) +
      rect(0, H / 2 - bandH / 2, W, bandH, cross)
    );
  }

  if (type === 'chevron') {
    const bg = p[0] ?? '#111827';
    const c1 = p[1] ?? '#E5E7EB';
    const c2 = p[2] ?? c1;
    const chevronDepth = 360;
    return (
      rect(0, 0, W, H, bg) +
      polygon(
        [
          [0, 0],
          [chevronDepth, H / 2],
          [0, H],
        ],
        c1,
      ) +
      polygon(
        [
          [0, 60],
          [chevronDepth - 60, H / 2],
          [0, H - 60],
        ],
        c2,
      )
    );
  }

  // circle_center
  const bg = p[0] ?? '#003049';
  const band = p[1] ?? '#FFFFFF';
  return rect(0, 0, W, H, bg) + rect(0, H * 0.4, W, H * 0.2, band);
}

function renderSymbols(spec: FlagSpec): string {
  const p = spec.palette;
  const symFill = p[p.length - 1] ?? '#FFFFFF';
  const out: string[] = [];

  for (const s of spec.symbols) {
    if (s.type === 'circle' && s.placement === 'center') {
      out.push(circle(W / 2, H / 2, 110, symFill));
      continue;
    }

    if (s.type === 'star') {
      const count = Math.max(1, s.count);
      if (s.placement === 'canton') {
        const startX = 170;
        const startY = 150;
        const gap = 95;
        for (let i = 0; i < count; i++) {
          const cx = startX + i * gap;
          const cy = startY;
          out.push(polygon(starPoints(cx, cy, 38, 16), symFill));
        }
      } else if (s.placement === 'stacked') {
        const cx = W / 2;
        const startY = H / 2 - ((count - 1) * 90) / 2;
        for (let i = 0; i < count; i++) {
          out.push(polygon(starPoints(cx, startY + i * 90, 38, 16), symFill));
        }
      } else {
        out.push(polygon(starPoints(W / 2, H / 2, 48, 20), symFill));
      }
      continue;
    }
  }

  return out.join('');
}

export function renderFlagSvg(spec: FlagSpec): string {
  const body = renderLayout(spec) + renderSymbols(spec);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Generated flag">
  ${body}
</svg>`;
}

