import { Router, Request, Response } from 'express';
import { getModeInfo, setMode, hasClaudeKey, hasLocalAIUrl, AIMode } from '../services/ai';

const router = Router();

router.get('/mode', (_req: Request, res: Response) => {
  res.json(getModeInfo());
});

router.post('/mode', (req: Request, res: Response): void => {
  const { mode } = req.body as { mode: AIMode };

  if (mode !== 'claude' && mode !== 'local') {
    res.status(400).json({ error: 'Invalid mode. Must be "claude" or "local".' });
    return;
  }

  if (mode === 'claude' && !hasClaudeKey()) {
    res.status(400).json({
      error: 'ANTHROPIC_API_KEY is not configured in server/.env. Add your key to enable Premium (Claude) mode.',
    });
    return;
  }

  if (mode === 'local' && !hasLocalAIUrl()) {
    res.status(400).json({
      error: 'LOCAL_AI_BASE_URL is not configured in server/.env. Point it at your local model server (e.g. Ollama at http://localhost:11434) to enable this mode.',
    });
    return;
  }

  setMode(mode);
  console.log(`[Mode] Switched to: ${mode}`);
  res.json(getModeInfo());
});

export default router;
