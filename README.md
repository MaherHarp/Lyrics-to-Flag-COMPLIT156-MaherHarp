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

Use the **Next.js app** in `apps/web`, not the Express API. If the API folder is the Vercel project root, the serverless runtime can crash (`FUNCTION_INVOCATION_FAILED`).

**Option A (recommended for this repo)** Leave Vercel **Root Directory** at the repository root (`.`). The root **`vercel.json`** installs with pnpm, builds only `@complit156/web` and its workspace deps (skips the Express API), and sets the Next.js framework preset so output is picked up correctly.

**Option B** Set Vercel **Root Directory** to **`apps/web`**. Then **`apps/web/vercel.json`** runs install and build from the monorepo parent.

For both options, add **`NEXT_PUBLIC_API_BASE_URL`** in Vercel (your deployed API base URL, no trailing slash). **`.nvmrc`** pins Node 20 for Vercel builds.

### Deploy API (not Vercel serverless)

Run `apps/api` on any Node host (Render, Railway, Fly.io, a VPS). Set **`CORS_ORIGINS`** to your Vercel site origin (comma-separated if you have preview and production), for example `https://your-app.vercel.app`. For local dev, defaults already allow `localhost` and `127.0.0.1` on port 3000.
