import { NextResponse } from 'next/server';
import { GenerateRequestSchema, GenerateResponseSchema } from '@complit156/shared';
import { generateFromLyric } from '../../../../lib/generate.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const out = generateFromLyric(parsed.data);
  const validated = GenerateResponseSchema.safeParse(out);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Server generation error', issues: validated.error.issues },
      { status: 500 },
    );
  }
  return NextResponse.json(validated.data);
}
