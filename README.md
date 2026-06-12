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

---

## Project Structure

```
├── package.json               Root workspace — dev, build, install:all scripts
├── .env.example               Template — copy to server/.env
│
├── client/                    React + Vite + TypeScript + Tailwind
│   ├── vite.config.ts         Dev server on port 5174, /api proxy → 3001
│   ├── vitest.config.ts       Vitest, jsdom, MSW, 95% coverage thresholds
│   └── src/
│       ├── App.tsx            Route definitions (5 routes + 404 redirect)
│       ├── pages/
│       │   ├── Landing.tsx    Track selection + AI engine picker
│       │   ├── Intake.tsx     3-step setup (JD → experience → CV upload)
│       │   ├── DeviceCheck.tsx Camera/mic permission check
│       │   ├── Interview.tsx  Main interview UI (all 3 phases)
│       │   └── Report.tsx     Post-interview evaluation report
│       ├── components/
│       │   ├── CodeGround.tsx     React coding environment (Sandpack)
│       │   ├── JSCodeGround.tsx   JavaScript coding environment (Sandpack)
│       │   ├── PhaseAdvanceModal.tsx  Phase transition countdown dialog
│       │   ├── EndConfirmModal.tsx    End-interview confirmation dialog
│       │   └── icons.tsx          SVG icon components
│       ├── hooks/
│       │   ├── useCamera.ts        Camera/mic stream management
│       │   ├── useSpeech.ts        TTS (speak) + STT (listen) hooks
│       │   └── useInterviewPhase.ts Phase timer and advance logic
│       ├── context/
│       │   └── SessionContext.tsx  Global session state (CV, JD, experience)
│       ├── types/
│       │   └── index.ts           Shared types + PHASE_DURATIONS constants
│       └── test/
│           ├── setup.ts           Vitest global setup (MSW, Speech API stubs)
│           ├── helpers/           renderWithProviders utility
│           └── mocks/             MSW server and route handlers
│
└── server/                    Express + TypeScript
    ├── jest.config.js         Jest + ts-jest, node env, 95% coverage thresholds
    ├── tsconfig.json          ES2020, commonjs, strict mode
    ├── tsconfig.test.json     Extends main — adds jest + node types for tests
    └── src/
        ├── index.ts           Entry: middleware (Helmet, CORS, rate-limit), routes
        ├── routes/
        │   ├── config.ts      GET /api/mode, POST /api/mode
        │   ├── parse.ts       POST /api/parse-cv, POST /api/fetch-jd
        │   ├── interview.ts   POST /api/interview/message
        │   ├── evaluate.ts    POST /api/evaluate
        │   └── phase2.ts      GET /api/phase2/exercises
        ├── services/
        │   ├── ai.ts          Mode routing — dispatches chat/evaluate to the right provider
        │   ├── claude.ts      Anthropic SDK wrapper (chat 600 tokens, evaluate 2000 tokens)
        │   ├── groq.ts        Groq SDK wrapper with 429/503 model fallback
        │   ├── freeAI.ts      Pollinations multi-model retry (3 rounds, backoff)
        │   └── jsExercises.ts JS exercise pool by experience level + Fisher-Yates shuffle
        └── types/
            └── index.ts       Shared server types
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/mode` | Current AI mode, model name, and key availability |
| `POST` | `/api/mode` | Switch AI mode (`"free"` / `"groq"` / `"claude"`) |
| `POST` | `/api/parse-cv` | Upload CV (PDF or DOCX, multipart/form-data) |
| `POST` | `/api/fetch-jd` | Fetch and extract text from a job posting URL |
| `POST` | `/api/interview/message` | Generate next interview question for the current phase |
| `POST` | `/api/evaluate` | Generate the end-of-interview evaluation report |
| `GET` | `/api/phase2/exercises` | Get randomised JS exercises (`?experience=0-2&count=4`) |

---

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

### Coverage summary

| Side | Files | Tests | Statements | Branches | Functions | Lines |
|---|---|---|---|---|---|---|
| Client | 15 | 156 | 73.6% | 70.8% | 66.0% | 77.4% |
| Server | 11 | 124 | 99.7% | 98.3% | 97.4% | 99.7% |

---

## Configuring Phase Durations

Edit `client/src/types/index.ts`:

```ts
export const PHASE_DURATIONS: Record<Phase, number> = {
  1: 10 * 60,   // Phase 1 — Introduction & Career  (10 min)
  2: 25 * 60,   // Phase 2 — Theory & Technical      (25 min)
  3: 30 * 60,   // Phase 3 — Practical / Coding      (30 min)
};
```

For quick local testing reduce these to e.g. `1 * 60` (1 minute each).

---

## Browser Requirements

- **Chrome / Edge** recommended — full Web Speech API (TTS + STT) support.
- Firefox: TTS works; STT requires enabling `media.webspeech.recognition.enable` in `about:config`.
- If STT is unavailable a typed-input fallback appears automatically.
- Screen sharing (Phase 3) requires a Chromium-based browser.

---

## Security Notes

- All API keys live only in `server/.env` — never sent to or stored in the browser.
- Vite's dev-server proxy forwards `/api/*` to Express so no credentials cross origins in development.
- Helmet sets secure HTTP response headers.
- Rate limiter: 30 requests/minute per IP on `/api/interview` and `/api/evaluate`.
- CV uploads: 10 MB limit, PDF and DOCX mime-types only.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Server won't start | Check `server/.env` exists; `PORT` defaults to `3001` |
| AI returns nothing / times out | Check the active mode on the Landing page; the free tier can be slow under load |
| CV parse fails | Use a text-based PDF (not a scanned image); DOCX also works |
| JD URL fetch fails | Some sites block scrapers — paste the JD text directly instead |
| No voice / AI is silent | Allow browser autoplay; check system audio output |
| STT not working | Use Chrome or Edge; grant microphone permission when prompted |
| Sandpack editor blank | Disable browser extensions that block iframe or sandbox origins |
