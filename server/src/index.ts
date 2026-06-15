import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import parseRouter from './routes/parse';
import interviewRouter from './routes/interview';
import evaluateRouter from './routes/evaluate';
import configRouter from './routes/config';
import phase2Router from './routes/phase2';
import ttsRouter from './routes/tts';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Cloud hosts (Render, etc.) put the app behind a reverse proxy. Trust the first
// proxy hop so express-rate-limit keys on the real client IP, not the proxy's.
app.set('trust proxy', 1);

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  // The client embeds the Sandpack editor (CDN + workers), web fonts, and plays
  // blob: TTS audio — Helmet's default strict CSP would block these and break
  // the served app. Other Helmet protections (HSTS, noSniff, etc.) stay on.
  contentSecurityPolicy: false,
}));
app.use(cors({ origin: ['http://localhost:5174', 'http://127.0.0.1:5174'] }));
app.use(express.json({ limit: '2mb' }));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please slow down.' },
});

const ttsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many TTS requests. Please slow down.' },
});

app.use('/api/interview', aiLimiter);
app.use('/api/evaluate', aiLimiter);
app.use('/api/tts', ttsLimiter);

app.use('/api', configRouter);
app.use('/api', parseRouter);
app.use('/api/interview', interviewRouter);
app.use('/api', evaluateRouter);
app.use('/api/phase2', phase2Router);
app.use('/api', ttsRouter);

// In production, serve the built client from the same origin (single-service
// deploy). API routes are under /api; everything else falls back to index.html
// so client-side routing works.
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get(/^(?!\/api).*/, (_req: express.Request, res: express.Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };

if (require.main === module) {
  app.listen(PORT, () => {
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY?.trim();
    const modeLabel = hasAnthropic
      ? '✦ Premium — Claude (Anthropic)'
      : '◆ Local — Ollama (OpenAI-compatible)';
    console.log(`\nMockInterview server → http://localhost:${PORT}`);
    console.log(`AI mode : ${modeLabel}\n`);
  });
}
