<img width="1909" height="845" alt="image" src="https://github.com/user-attachments/assets/f5c9a6b9-1778-4b2f-a168-42c911304e04" />


# AI Mock Interview

A full-stack AI-powered technical mock interview platform. Conduct realistic, voice-driven coding interviews with adaptive AI questioning, live code execution, and a scored performance report. The **Coding / Technical** track is fully functional; Sales and Marketing tracks are coming soon.

---

## Features

- **3-phase interview structure**
  - Phase 1 — Introduction & Career (10 min): background, experience, and motivation
  - Phase 2 — Theory & Technical (25 min): live JavaScript coding exercises in a browser-embedded editor
  - Phase 3 — Practical / Coding (30 min): open-ended problem solving with optional screen sharing
- **Three AI engine options** — Claude (Anthropic), Groq (Llama), or a fully free Pollinations tier — switchable live from the UI without restarting
- **Voice-driven interface** — AI speaks questions via TTS; answer with Speech-to-Text or typed input fallback
- **CV + JD personalisation** — questions tailored to your uploaded CV and the target job description
- **Live code editor** — Sandpack-powered JavaScript environment with instant execution in Phase 2
- **Adaptive follow-ups** — AI adjusts questions based on your actual answers
- **Performance report** — overall score, per-phase breakdown, strengths, and improvement areas
- **Security** — Helmet headers, CORS whitelist, rate limiting (30 req/min on AI routes), all API keys server-side only

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Vite |
| Backend | Express.js, TypeScript, ts-node |
| AI providers | Anthropic Claude Sonnet, Groq Llama 3.3 70B, Pollinations (free) |
| Code editor | CodeSandbox Sandpack |
| UI testing | Vitest, React Testing Library, MSW, jsdom |
| API testing | Jest, Supertest, ts-jest |

---

## Prerequisites

- Node.js 18+
- An API key is **optional** — the free Pollinations tier works with no configuration. For better quality, supply an Anthropic or Groq key.

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

### 3. Configure environment

```bash
cp .env.example server/.env
```

Edit `server/.env`:

```env
# Optional — leave blank to use the free AI tier
ANTHROPIC_API_KEY=sk-ant-...your-key...
GROQ_API_KEY=gsk_...your-key...

PORT=3001
NODE_ENV=development
```

> **AI mode priority on startup:** Claude (if `ANTHROPIC_API_KEY` present) → Groq (if `GROQ_API_KEY` present) → Free Pollinations. Switch modes live from the Landing page at any time.

### 4. Start the application

```bash
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5174 |
| Backend API | http://localhost:3001 |

---

## AI Engine Modes

| Mode | Model | Key Required | Notes |
|---|---|---|---|
| **Claude** | claude-sonnet-4-6 | `ANTHROPIC_API_KEY` | Best quality |
| **Groq** | llama-3.3-70b-versatile | `GROQ_API_KEY` | Fast, free tier available |
| **Free** | Pollinations (openai / mistral / llama) | None | No key needed, slower |

Switch the active engine from the **Landing page → AI Engine section** without restarting the server.

## Running Tests

```bash
# Client — Vitest
cd client
npm test                  # single run
npm run test:coverage     # with coverage report

# Server — Jest
cd server
npm test                  # single run
npm run test:coverage     # with coverage report

```
