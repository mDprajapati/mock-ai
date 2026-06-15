<img width="1492" height="813" alt="image" src="https://github.com/user-attachments/assets/13bd22b8-303f-459c-aea3-0919d26687f6" />


# AI Mock Interview

A full-stack AI-powered technical mock interview platform. Conduct realistic, voice-driven coding interviews with adaptive AI questioning, live code execution, and a scored performance report. The **Coding / Technical** track is fully functional; Sales and Marketing tracks are coming soon.

---

## Features

- **3-phase interview structure**
  - Phase 1 — Introduction & Career (10 min): background, experience, and motivation
  - Phase 2 — Theory & Technical (25 min): live JavaScript coding exercises in a browser-embedded editor
  - Phase 3 — Practical / Coding (30 min): open-ended problem solving with optional screen sharing
- **Two AI engine options** — **Premium** (Anthropic Claude) or **Local** (Ollama, runs on your machine) — switchable live from the UI without restarting
- **Voice-driven interface** — AI speaks questions via neural TTS (Azure, with browser fallback); answer with Speech-to-Text or typed input
- **CV + JD personalisation** — questions tailored to your uploaded CV and the target job description
- **Live code editor** — Sandpack-powered JavaScript environment with instant execution in Phase 2
- **Adaptive follow-ups** — AI adjusts questions based on your actual answers
- **Performance report** — overall score, per-phase breakdown, strengths, and improvement areas
- **Security** — Helmet headers, CORS whitelist, rate limiting on AI routes, all API keys server-side only

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Vite |
| Backend | Express.js, TypeScript, ts-node |
| AI providers | Anthropic Claude Sonnet (Premium) · Ollama / OpenAI-compatible (Local) |
| Voice | Azure Neural TTS (`en-IN-PrabhatNeural`) with browser `speechSynthesis` fallback |
| Code editor | CodeSandbox Sandpack |
| UI testing | Vitest, React Testing Library, MSW, jsdom |
| API testing | Jest, Supertest, ts-jest |

---

## AI Engine Modes

| Mode | Engine | Key / requirement | Notes |
|---|---|---|---|
| **Premium** | Claude Sonnet (Anthropic) | `ANTHROPIC_API_KEY` | Best quality, paid API |
| **Local** | Ollama (`qwen2.5:7b` by default) | Ollama running locally | Free, private, offline; slower without a GPU |

Each mode's card unlocks automatically once its requirement is configured. You need **at least one** of the two. Switch the active engine from the **Landing page → AI Engine section** without restarting the server.

---

## Prerequisites

- **Node.js** 18+ and npm
- **For Local mode:** [Ollama](https://ollama.com/download) installed and running
- **For Premium mode:** an [Anthropic API key](https://console.anthropic.com/)
- **Optional (natural voice):** an [Azure Speech](https://portal.azure.com/) resource (free F0 tier). Without it the interviewer uses the browser's built-in voice.

---

## Quick Start

### 1. Clone the repository

```bash
git clone <repo-url>
cd mock-interview
```

### 2. Install all dependencies

```bash
npm run install:all
```

This installs packages for the root, `client/`, and `server/` in one step.

### 3. Set up the Local mode engine (Ollama)

Skip this if you only want Premium (Claude) mode.

1. Install Ollama from https://ollama.com/download — it runs as a background service on `http://localhost:11434`.
2. Pull the interviewer model:

   ```bash
   ollama pull qwen2.5:7b
   ```

   > `qwen2.5:7b` is the recommended default. On a machine **without a GPU** it runs but is slow (a few tokens/sec). For a faster, lighter option: `ollama pull llama3.2:3b` and set `LOCAL_AI_MODEL=llama3.2:3b`.

### 4. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```env
# Premium mode — Anthropic Claude (leave blank to use Local mode only)
ANTHROPIC_API_KEY=sk-ant-...your-key...

# Local mode — Ollama (OpenAI-compatible). Adapter appends /v1/chat/completions.
LOCAL_AI_BASE_URL=http://localhost:11434
LOCAL_AI_API_KEY=
LOCAL_AI_MODEL=qwen2.5:7b

PORT=4001
NODE_ENV=development

# Optional — natural Indian-English voice via Azure Speech.
# Leave AZURE_SPEECH_KEY blank to use the browser's built-in voice.
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
AZURE_SPEECH_VOICE=en-IN-PrabhatNeural
```

> **Mode auto-detection on startup:** Premium (if `ANTHROPIC_API_KEY` present) → otherwise Local. You can switch live from the Landing page.
>
> **Never commit `server/.env`** — it holds secrets and is git-ignored.

### 5. Start the application

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:4001 |

Open the **frontend** URL in your browser.

---

## Build (production)

```bash
npm run build                  # builds server (tsc) + client (vite)
npm run start --prefix server  # serves the compiled API from server/dist
```

The built client lives in `client/dist/` — serve it statically or behind a reverse proxy in front of the API.

---

## Running Tests

```bash
# Client — Vitest
cd client && npm test            # single run  (npm run test:coverage for coverage)

# Server — Jest
cd server && npm test            # single run  (npm run test:coverage for coverage)
```

---

## Notes

- **Local mode runs on the same machine as the server.** If you deploy the server to the cloud, Local mode only works when `LOCAL_AI_BASE_URL` points to a reachable OpenAI-compatible model server — a cloud server cannot reach an Ollama instance on your laptop.
- **Voice:** neural TTS is used when Azure is configured; otherwise the browser's `speechSynthesis`. Speech-to-text uses the browser Web Speech API (best in Chrome/Edge).
