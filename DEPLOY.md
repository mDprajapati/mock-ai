# Deploying MockInterview

The app is set up to deploy as a **single web service**: the Express server serves
both the API (`/api/*`) and the built React client (everything else). These steps
use [Render](https://render.com) (free tier), but any Node host works.

> **Important — modes in the cloud:**
> - **Premium (Claude)** works once you set `ANTHROPIC_API_KEY`.
> - **Local (Ollama)** will **not** work on a public URL — Ollama runs only on your
>   own machine, and a cloud server can't reach it. The Local card stays locked.
>
> So a deployed instance is effectively a **Premium-only** demo.

---

## Prerequisites

- The code pushed to a **GitHub** (or GitLab) repository.
- A free **Render** account: https://render.com
- Your **Anthropic API key**: https://console.anthropic.com

---

## Option A — Blueprint (uses `render.yaml`, recommended)

1. Push this repo to GitHub (ensure `server/.env` is **not** committed — it's git-ignored).
2. In Render: **New → Blueprint**.
3. Connect your repo. Render reads [`render.yaml`](render.yaml) and proposes a web
   service named `mock-interview` with:
   - **Build:** `npm run install:all && npm run build`
   - **Start:** `npm run start --prefix server`
4. Click **Apply**. The service is created.
5. Open the service → **Environment** → add a secret:
   - `ANTHROPIC_API_KEY` = `sk-ant-...your key...`
   (`NODE_ENV=production` is already set by the blueprint.)
6. **Manual Deploy → Deploy latest commit** (or it deploys automatically).
7. When the build finishes, open the `https://mock-interview-xxxx.onrender.com` URL.

## Option B — Manual web service (no blueprint)

1. Render: **New → Web Service**, connect your repo.
2. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm run install:all && npm run build`
   - **Start Command:** `npm run start --prefix server`
3. **Environment variables:**
   - `NODE_ENV` = `production`
   - `ANTHROPIC_API_KEY` = `sk-ant-...` (mark as secret)
4. **Create Web Service** and wait for the first deploy.

---

## How it works in production

- `npm run build` compiles the server (`server/dist`) and bundles the client (`client/dist`).
- `node dist/index.js` (via `start`) serves:
  - `GET /api/*` → the Express API
  - everything else → the client's `index.html` (SPA routing)
- Render injects `PORT`; the server reads `process.env.PORT` automatically.

## Verifying locally before you deploy

```bash
npm run build
NODE_ENV=production PORT=4001 node server/dist/index.js
# open http://localhost:4001  → the full app
# http://localhost:4001/api/mode → JSON
```

## Notes & gotchas

- **Free tier cold starts:** Render's free web services spin down after ~15 min idle;
  the first request after that takes ~30–60s to wake.
- **Secrets:** never commit `server/.env`. Set keys only in the host's dashboard.
- **Enabling Local mode in the cloud (advanced):** you'd need a publicly reachable
  OpenAI-compatible model server (e.g. a GPU host running Ollama/vLLM behind HTTPS),
  then set `LOCAL_AI_BASE_URL` (and `LOCAL_AI_API_KEY`) in the host environment.
