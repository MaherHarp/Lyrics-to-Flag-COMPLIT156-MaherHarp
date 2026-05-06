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
2. Import it on Vercel.
3. **Important:** in the Vercel project's **Settings → General → Root Directory**, set it to **`apps/web`**, then redeploy. Vercel needs `next` in the package.json at the configured root, so this must be `apps/web`, not the repo root.
4. `apps/web/vercel.json` walks up to the workspace root for `pnpm install` and the filtered build, so the monorepo still works end to end.
5. No environment variables required. `.nvmrc` pins Node 20 for Vercel builds.

API endpoints (same origin in production):

- `POST /api/v1/generate`
- `GET  /api/v1/flags`
- `GET  /api/v1/flags/:code`
