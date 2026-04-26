import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import { awardStars } from '../utils/progress.js';
import { STARS_EMOTION_STRATEGY } from '../utils/levels.js';

const router = Router();

router.post('/', requireAuth, (req, res) => {
  const { emotion, intensity, strategyChosen } = req.body;
  if (!emotion) return res.status(400).json({ error: 'emotion requerido' });
  const id = randomUUID();
  db.prepare(
    'INSERT INTO emotional_logs (id,user_id,emotion,intensity,strategy_chosen) VALUES (?,?,?,?,?)'
  ).run(id, req.user.id, emotion, intensity || null, strategyChosen || null);

  db.prepare('INSERT INTO usage_events (id,user_id,event_type,details) VALUES (?,?,?,?)')
    .run(randomUUID(), req.user.id, 'emotion_logged', JSON.stringify({ emotion, autonomous: !!strategyChosen }));

  let progress = null;
  if (req.user.role === 'child' && strategyChosen) {
    progress = awardStars(req.user.id, STARS_EMOTION_STRATEGY);
  }

  res.status(201).json({ id, progress });
});

router.get('/', requireAuth, (req, res) => {
  const childId = req.query.childId || req.user.id;
  const rows = db.prepare(
    'SELECT * FROM emotional_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 50'
  ).all(childId);
  res.json(rows);
});

export default router;
