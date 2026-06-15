import { Router, Request, Response } from 'express';
import { hasAzureTTS, synthesize } from '../services/tts';

const router = Router();

// Lets the client decide whether to use server-side neural TTS or fall back
// to the browser's built-in speechSynthesis.
router.get('/tts/status', (_req: Request, res: Response) => {
  res.json({ available: hasAzureTTS() });
});

router.post('/tts', async (req: Request, res: Response): Promise<void> => {
  const { text } = req.body as { text?: string };

  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Missing "text" in request body.' });
    return;
  }

  if (!hasAzureTTS()) {
    res.status(503).json({
      error: 'Neural TTS is not configured. Set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in server/.env.',
    });
    return;
  }

  try {
    // Cap length to protect the quota / latency; client already strips markdown.
    const audio = await synthesize(text.slice(0, 5000));
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-store');
    res.send(audio);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    console.error(`[TTS] Azure synthesis failed${status ? ` (HTTP ${status})` : ''}`);
    res.status(502).json({ error: 'Speech synthesis failed.' });
  }
});

export default router;
