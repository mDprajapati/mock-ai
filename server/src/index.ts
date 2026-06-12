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

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ['http://localhost:5174', 'http://127.0.0.1:5174'] }));
app.use(express.json({ limit: '2mb' }));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please slow down.' },
});

app.use('/api/interview', aiLimiter);
app.use('/api/evaluate', aiLimiter);

app.use('/api', configRouter);
app.use('/api', parseRouter);
app.use('/api/interview', interviewRouter);
app.use('/api', evaluateRouter);
app.use('/api/phase2', phase2Router);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

export { app };

if (require.main === module) {
  app.listen(PORT, () => {
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY?.trim();
    const hasGroq      = !!process.env.GROQ_API_KEY?.trim();
    const modeLabel = hasAnthropic
      ? '✦ Claude (Anthropic)'
      : hasGroq
      ? '✦ Groq — Llama 3.3-70B (Free)'
      : '◈ Free — Pollinations / GPT-4o-mini';
    console.log(`\nMockInterview server → http://localhost:${PORT}`);
    console.log(`AI mode : ${modeLabel}\n`);
  });
}
