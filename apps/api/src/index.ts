import cors from 'cors';
import express from 'express';
import {
  GenerateRequestSchema,
  GenerateResponseSchema,
  FlagListResponseSchema,
  type FlagInfo,
} from '@complit156/shared';
import { generateFromLyric } from './lib/generate.js';
import { COUNTRY_FLAGS, findCountryByCode } from './lib/countries.js';
import { generateBlazonForCountry } from './lib/blazon.js';

const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
  }),
);

app.get('/v1/health', (_req, res) => {
  res.json({ ok: true, flags: COUNTRY_FLAGS.length });
});

app.post('/v1/generate', (req, res) => {
  const parsed = GenerateRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', issues: parsed.error.issues });
    return;
  }

  const out = generateFromLyric(parsed.data);

  const validated = GenerateResponseSchema.safeParse(out);
  if (!validated.success) {
    res.status(500).json({ error: 'Server generation error', issues: validated.error.issues });
    return;
  }

  res.json(validated.data);
});

function toFlagInfo(c: typeof COUNTRY_FLAGS[number]): FlagInfo {
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

app.get('/v1/flags', (req, res) => {
  const region = typeof req.query.region === 'string' ? req.query.region : undefined;
  const family = typeof req.query.family === 'string' ? req.query.family : undefined;
  const layout = typeof req.query.layout === 'string' ? req.query.layout : undefined;
  const q =
    typeof req.query.q === 'string' ? req.query.q.trim().toLowerCase() : undefined;

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
    res.status(500).json({ error: 'Server flag list error', issues: validated.error.issues });
    return;
  }
  res.json(validated.data);
});

app.get('/v1/flags/:code', (req, res) => {
  const c = findCountryByCode(req.params.code);
  if (!c) {
    res.status(404).json({ error: 'Flag not found', code: req.params.code });
    return;
  }
  res.json(toFlagInfo(c));
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT} with ${COUNTRY_FLAGS.length} flags.`);
});
