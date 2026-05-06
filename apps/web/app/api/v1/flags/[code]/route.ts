import { NextResponse } from 'next/server';
import type { FlagInfo } from '@complit156/shared';
import { findCountryByCode } from '../../../../../lib/countries.js';
import { generateBlazonForCountry } from '../../../../../lib/blazon.js';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const c = findCountryByCode(code);
  if (!c) {
    return NextResponse.json({ error: 'Flag not found', code }, { status: 404 });
  }
  const info: FlagInfo = {
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
  return NextResponse.json(info);
}
