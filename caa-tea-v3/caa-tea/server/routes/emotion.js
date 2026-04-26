import { Router } from 'express';
import db, { uuid } from '../db/sqlite.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/', requireAuth, (req, res) => {
  try {
    const { emotion, intensity, strategyChosen } = req.body;
    if (!emotion) return res.status(400).json({ error: 'emotion requerido' });
    const id = uuid();
    db.run(`INSERT INTO emotional_logs (id,user_id,emotion,intensity,strategy_chosen) VALUES (?,?,?,?,?)`,
      [id, req.user.id, emotion, intensity||null, strategyChosen||null]);
    res.status(201).json({ id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/', requireAuth, (req, res) => {
  try {
    const childId = req.query.childId || req.user.id;
    res.json(db.all(`SELECT * FROM emotional_logs WHERE user_id=? ORDER BY created_at DESC LIMIT 50`, [childId]));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
