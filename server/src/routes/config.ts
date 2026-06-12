import { Router, Request, Response } from 'express';
import { getModeInfo, setMode, hasClaudeKey, hasGroqKey, AIMode } from '../services/ai';

const router = Router();

router.get('/mode', (_req: Request, res: Response) => {
  res.json(getModeInfo());
});

router.post('/mode', (req: Request, res: Response): void => {
  const { mode } = req.body as { mode: AIMode };

  if (mode !== 'claude' && mode !== 'groq' && mode !== 'free') {
    res.status(400).json({ error: 'Invalid mode. Must be "claude", "groq", or "free".' });
    return;
  }

  if (mode === 'claude' && !hasClaudeKey()) {
    res.status(400).json({
      error: 'ANTHROPIC_API_KEY is not configured in server/.env. Add your key to enable Claude mode.',
    });
    return;
  }

  if (mode === 'groq' && !hasGroqKey()) {
    res.status(400).json({
      error: 'GROQ_API_KEY is not configured in server/.env. Add your free key from console.groq.com.',
    });
    return;
  }

  setMode(mode);
  console.log(`[Mode] Switched to: ${mode}`);
  res.json(getModeInfo());
});

export default router;
