import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/emotion  { emotion, intensity, strategyChosen }
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { emotion, intensity, strategyChosen } = req.body;
    if (!emotion) return res.status(400).json({ error: 'emotion required' });

    const { rows } = await query(
      `INSERT INTO emotional_logs (user_id, emotion, intensity, strategy_chosen)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.user.id, emotion, intensity || null, strategyChosen || null]
    );

    await query(
      `INSERT INTO usage_events (user_id, event_type, details) VALUES ($1,'emotion_logged',$2)`,
      [req.user.id, JSON.stringify({ emotion, hasStrategy: !!strategyChosen })]
    );

    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// GET /api/emotion?childId=&limit=50
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const childId = req.query.childId || req.user.id;
    const { rows } = await query(
      `SELECT * FROM emotional_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [childId]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
