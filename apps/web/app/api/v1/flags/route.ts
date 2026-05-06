import { NextResponse } from 'next/server';
import type { FlagInfo } from '@complit156/shared';
import { FlagListResponseSchema } from '@complit156/shared';
import { COUNTRY_FLAGS } from '../../../../lib/countries.js';
import { generateBlazonForCountry } from '../../../../lib/blazon.js';

export const runtime = 'nodejs';

function toFlagInfo(c: (typeof COUNTRY_FLAGS)[number]): FlagInfo {
  return {
    name: c.name,
    code: c.code,
    region: c.region,
    aspect_ratio: c.aspect_ratio,
    palette: c.palette,
    symbolism: c.symbolism,
    heraldic_family: c.heraldic_family,
    layout: c.properties.layout,
    blazon: generateBlazonForCountry(c),
    svg: c.svg,
  };
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const region = url.searchParams.get('region') ?? undefined;
  const family = url.searchParams.get('family') ?? undefined;
  const layout = url.searchParams.get('layout') ?? undefined;
  const q = url.searchParams.get('q')?.trim().toLowerCase() || undefined;

  let list = COUNTRY_FLAGS.slice();
  if (region) list = list.filter((c) => c.region === region);
  if (family) list = list.filter((c) => c.heraldic_family === family);
  if (layout) list = list.filter((c) => c.properties.layout === layout);
  if (q) {
    list = list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.symbolism.toLowerCase().includes(q),
    );
  }
  list.sort((a, b) => a.name.localeCompare(b.name));

  const payload = { total: list.length, flags: list.map(toFlagInfo) };
  const validated = FlagListResponseSchema.safeParse(payload);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Server flag list error', issues: validated.error.issues },
      { status: 500 },
    );
  }
  return NextResponse.json(validated.data);
}
