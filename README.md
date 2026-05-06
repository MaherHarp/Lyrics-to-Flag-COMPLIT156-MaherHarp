## COMPLIT156 Flag-from-Lyric Computational Experiment

### Repository layout

- **`apps/web`** Next.js (App Router) + TypeScript + Tailwind
- **`apps/api`** Node.js + Express + TypeScript
- **`packages/shared`** Shared Zod schemas + types

### Dev

```bash
pnpm i
pnpm dev
```

### Deploy frontend (Vercel)

Use the **Next.js app** in `apps/web`, not the Express API. If the API is the Vercel project root, the serverless runtime will crash (`FUNCTION_INVOCATION_FAILED`).

1. Vercel project **Root Directory** → `apps/web`
2. **Environment variables** → add `NEXT_PUBLIC_API_BASE_URL` with your deployed API base URL (no trailing slash), for example `https://your-api.onrender.com`
3. Redeploy

`apps/web/vercel.json` runs `pnpm install` and `pnpm --filter @complit156/web build` from the monorepo root so `packages/shared` resolves.

### Deploy API (not Vercel serverless)

Run `apps/api` on any Node host (Render, Railway, Fly.io, a VPS). Set **`CORS_ORIGINS`** to your Vercel site origin (comma-separated if you have preview and production), for example `https://your-app.vercel.app`. For local dev, defaults already allow `localhost` and `127.0.0.1` on port 3000.
