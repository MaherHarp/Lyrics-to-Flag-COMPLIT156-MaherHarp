## COMPLIT156 Flag-from-Lyric Computational Experiment

### Repository layout

- **`apps/web`** Next.js (App Router) + TypeScript + Tailwind. Includes API route handlers under `app/api/v1/*` — the whole app deploys as a single Vercel project.
- **`apps/api`** (legacy) Standalone Express server. Optional, kept for reference. Not used in production.
- **`packages/shared`** Shared Zod schemas + types.

### Dev

```bash
pnpm i
pnpm --filter @complit156/web dev
```

App runs at `http://127.0.0.1:3000`. The API is in-process via Next route handlers — no separate server to start.

### Deploy to Vercel

1. Push the repo to GitHub.
2. Import it on Vercel. Leave **Root Directory** at repo root.
3. The root `vercel.json` installs with `pnpm`, builds only `@complit156/web` (and its workspace deps), and sets the Next.js framework preset.
4. No environment variables required. `.nvmrc` pins Node 20 for Vercel builds.

API endpoints (same origin in production):

- `POST /api/v1/generate`
- `GET  /api/v1/flags`
- `GET  /api/v1/flags/:code`
