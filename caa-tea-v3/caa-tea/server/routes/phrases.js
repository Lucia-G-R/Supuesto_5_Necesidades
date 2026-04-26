import { Router } from 'express';
import db, { uuid } from '../db/sqlite.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, (req, res) => {
  try {
    const { pictogramIds, phraseText } = req.body;
    if (!Array.isArray(pictogramIds)||!pictogramIds.length)
      return res.status(400).json({ error: 'pictogramIds requerido' });
    const id = uuid();
    db.run(`INSERT INTO generated_phrases (id,user_id,pictogram_ids,phrase_length,phrase_text) VALUES (?,?,?,?,?)`,
      [id, req.user.id, JSON.stringify(pictogramIds), pictogramIds.length, phraseText]);
    db.run(`INSERT INTO usage_events (id,user_id,event_type,details) VALUES (?,?,?,?)`,
      [uuid(), req.user.id, 'phrase_built', JSON.stringify({length:pictogramIds.length})]);
    res.status(201).json({ id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/', requireAuth, (req, res) => {
  try {
    const childId = req.query.childId || req.user.id;
    const rows = db.all(`SELECT * FROM generated_phrases WHERE user_id=? ORDER BY created_at DESC LIMIT 20`, [childId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
