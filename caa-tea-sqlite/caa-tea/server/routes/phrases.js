import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import { awardStars } from '../utils/progress.js';
import { starsForPhrase } from '../utils/levels.js';

const router = Router();

router.post('/', requireAuth, (req, res) => {
  const { pictogramIds, phraseText } = req.body;
  if (!Array.isArray(pictogramIds) || !pictogramIds.length)
    return res.status(400).json({ error: 'pictogramIds requerido' });

  const id = randomUUID();
  db.prepare(
    'INSERT INTO generated_phrases (id,user_id,pictogram_ids,phrase_length,phrase_text) VALUES (?,?,?,?,?)'
  ).run(id, req.user.id, JSON.stringify(pictogramIds), pictogramIds.length, phraseText);

  db.prepare('INSERT INTO usage_events (id,user_id,event_type,details) VALUES (?,?,?,?)')
    .run(randomUUID(), req.user.id, 'phrase_built', JSON.stringify({ length: pictogramIds.length }));

  // Estrellas: solo si es niño (los adultos no acumulan progreso)
  let progress = null;
  if (req.user.role === 'child') {
    progress = awardStars(req.user.id, starsForPhrase(pictogramIds.length));
  }

  res.status(201).json({ id, progress });
});

router.get('/', requireAuth, (req, res) => {
  const childId = req.query.childId || req.user.id;
  const limit   = Math.min(parseInt(req.query.limit) || 20, 100);
  const rows = db.prepare(
    'SELECT * FROM generated_phrases WHERE user_id=? ORDER BY created_at DESC LIMIT ?'
  ).all(childId, limit);
  res.json(rows);
});

export default router;
