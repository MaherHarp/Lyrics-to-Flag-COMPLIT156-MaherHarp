'use client';

import type { FlagInfo, FlagListResponse } from '@complit156/shared';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, FieldLabel, Pill } from '../../components/ui';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

const REGIONS: { value: string; label: string }[] = [
  { value: '', label: 'All regions' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia', label: 'Asia' },
  { value: 'africa', label: 'Africa' },
  { value: 'americas', label: 'Americas' },
  { value: 'oceania', label: 'Oceania' },
  { value: 'middle_east', label: 'Middle East' },
];

const FAMILIES: { value: string; label: string }[] = [
  { value: '', label: 'All heraldic families' },
  { value: 'tricolor_horizontal', label: 'Tricolor (horizontal)' },
  { value: 'tricolor_vertical', label: 'Tricolor (vertical)' },
  { value: 'bicolor_horizontal', label: 'Bicolor (horizontal)' },
  { value: 'bicolor_vertical', label: 'Bicolor (vertical)' },
  { value: 'nordic_cross', label: 'Nordic cross' },
  { value: 'centered_cross', label: 'Centered cross' },
  { value: 'saltire', label: 'Saltire' },
  { value: 'pall', label: 'Pall' },
  { value: 'canton_with_charge', label: 'Canton with charge' },
  { value: 'triangle_hoist', label: 'Triangle at hoist' },
  { value: 'crescent_star', label: 'Crescent and star' },
  { value: 'centered_disc', label: 'Centered disc' },
  { value: 'centered_charge', label: 'Centered charge' },
  { value: 'multi_stripe', label: 'Many stripes' },
  { value: 'quartered', label: 'Quartered' },
  { value: 'serration', label: 'Serration' },
  { value: 'other', label: 'Other' },
];

function safeSvg(svg: string): string | null {
  const s = svg.trim();
  if (!s.includes('<svg') || !s.includes('</svg>')) return null;
  const lower = s.toLowerCase();
  if (
    lower.includes('<script') ||
    lower.includes('onload=') ||
    lower.includes('javascript:')
  )
    return null;
  return s;
}

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-sm border border-black/30"
      style={{ backgroundColor: hex }}
      title={hex}
    />
  );
}

export default function FlagLibraryPage() {
  const [region, setRegion] = useState('');
  const [family, setFamily] = useState('');
  const [search, setSearch] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [flags, setFlags] = useState<FlagInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<FlagInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (region) params.set('region', region);
        if (family) params.set('family', family);
        if (search.trim()) params.set('q', search.trim());
        const res = await fetch(`${API_BASE}/v1/flags?${params.toString()}`);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`API error (${res.status}). ${t.slice(0, 200)}`);
        }
        const data = (await res.json()) as FlagListResponse;
        if (!cancelled) setFlags(data.flags);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    const handle = setTimeout(load, search.trim() ? 220 : 0);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [region, family, search]);

  const filtered = useMemo(() => {
    if (!colorFilter.trim()) return flags;
    const target = colorFilter.trim().toLowerCase();
    const targetHex = target.startsWith('#') ? target : null;
    return flags.filter((f) => {
      if (targetHex) return f.palette.some((c) => c.toLowerCase() === targetHex);
      return f.palette.some((c) => c.toLowerCase().includes(target));
    });
  }, [flags, colorFilter]);

  return (
    <div className="space-y-6">
      <div className="space-y-2.5">
        <h1 className="text-2xl font-semibold tracking-tight text-white/90">
          Flag Library
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/40">
          Browse the country flags available to the matcher. Filter by region, by
          heraldic family, by color, or search by name and symbolism. Click any flag
          for its full metadata and blazon.
        </p>
      </div>

      <Card>
        <CardHeader title="Filters" subtitle="Narrow the library by region, family, color, or text." />
        <div className="grid gap-4 p-6 lg:grid-cols-4">
          <div className="space-y-1.5">
            <FieldLabel>Region</FieldLabel>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2 text-sm text-white/85 outline-none focus:border-[#8B1A1A]/50"
            >
              {REGIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Heraldic family</FieldLabel>
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2 text-sm text-white/85 outline-none focus:border-[#8B1A1A]/50"
            >
              {FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Search by name</FieldLabel>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sweden, JP, sun, etc."
              className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/20 focus:border-[#8B1A1A]/50"
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>Filter by color hex</FieldLabel>
            <input
              type="search"
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value)}
              placeholder="#FFCC00 or red"
              className="w-full rounded-xl border border-white/[0.08] bg-black/35 px-3 py-2 text-sm text-white/85 outline-none placeholder:text-white/20 focus:border-[#8B1A1A]/50"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-xs text-white/40">
          {loading ? 'Loading library…' : `${filtered.length} flag${filtered.length === 1 ? '' : 's'} shown`}
        </div>
        {error ? <div className="text-xs text-red-400">{error}</div> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((f) => {
          const safe = safeSvg(f.svg);
          return (
            <button
              key={f.code}
              type="button"
              onClick={() => setSelected(f)}
              className="group rounded-2xl border border-[#9B2020]/[0.18] bg-[#200606]/55 p-3 text-left transition hover:border-[#9B2020]/45 hover:bg-[#240707]/70 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            >
              <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-white shadow-md shadow-black/40">
                {safe ? (
                  <div
                    className="w-full"
                    style={{ aspectRatio: f.aspect_ratio }}
                    role="img"
                    aria-label={`Flag of ${f.name}`}
                    dangerouslySetInnerHTML={{ __html: safe }}
                  />
                ) : (
                  <div
                    className="flex w-full items-center justify-center text-xs text-black/45"
                    style={{ aspectRatio: f.aspect_ratio }}
                  >
                    Render unavailable
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold text-white/85">{f.name}</span>
                <Pill>{f.code}</Pill>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5">
                {f.palette.slice(0, 5).map((c) => (
                  <ColorSwatch key={c} hex={c} />
                ))}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-widest text-white/30">
                {f.heraldic_family.replace(/_/g, ' ')}
              </div>
            </button>
          );
        })}
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#9B2020]/[0.12] bg-[#1A0404]/50 p-10 text-center text-sm text-white/35">
          No flags match the current filters.
        </div>
      ) : null}

      {selected ? (
        <FlagDetailModal flag={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}

function FlagDetailModal({ flag, onClose }: { flag: FlagInfo; onClose: () => void }) {
  const safe = safeSvg(flag.svg);
  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/72 p-4 sm:p-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-[#9B2020]/30 bg-[#1B0606] shadow-2xl shadow-black/70"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#9B2020]/[0.15] px-6 py-4">
          <div>
            <div className="text-base font-semibold text-white/90">{flag.name}</div>
            <div className="text-xs text-white/35">
              {flag.code} · {flag.region.replace(/_/g, ' ')} · aspect {flag.aspect_ratio.toFixed(2)}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail"
            className="rounded-md border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/65 hover:bg-white/[0.08] hover:text-white"
          >
            Close
          </button>
        </div>
        <div className="grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-white">
              {safe ? (
                <div
                  className="w-full"
                  style={{ aspectRatio: flag.aspect_ratio }}
                  role="img"
                  aria-label={`Flag of ${flag.name}`}
                  dangerouslySetInnerHTML={{ __html: safe }}
                />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {flag.palette.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-black/30 px-2.5 py-1 text-[11px] font-mono text-white/55"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-sm border border-black/40"
                    style={{ backgroundColor: c }}
                  />
                  {c.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Symbolism
              </div>
              <p className="mt-1 text-sm leading-relaxed text-white/65">
                {flag.symbolism}
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Heraldic family
              </div>
              <p className="mt-1 text-sm text-white/65">
                {flag.heraldic_family.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Layout
              </div>
              <p className="mt-1 text-sm text-white/65">
                {flag.layout.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                Blazon
              </div>
              <p
                className="mt-1 text-sm italic leading-relaxed text-white/70"
                style={{ fontFamily: 'var(--font-lora), Georgia, serif' }}
              >
                &ldquo;{flag.blazon}&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
