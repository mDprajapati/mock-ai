import { Router, Request, Response } from 'express';
import { pickExercises } from '../services/jsExercises';

const router = Router();

// GET /api/phase2/exercises?experience=2-5&count=4
router.get('/exercises', (req: Request, res: Response): void => {
  const experience = (req.query.experience as string) || '0-2';
  const count = Math.min(parseInt(req.query.count as string) || 4, 5);
  const exercises = pickExercises(experience, count);
  console.log(`[Phase2] Picked ${exercises.length} exercises for experience="${experience}"`);
  res.json({ exercises });
});

export default router;
