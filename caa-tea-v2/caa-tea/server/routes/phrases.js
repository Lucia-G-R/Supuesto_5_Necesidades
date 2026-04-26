import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/phrases  { pictogramIds, phraseText }
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { pictogramIds, phraseText } = req.body;
    if (!Array.isArray(pictogramIds) || !pictogramIds.length) {
      return res.status(400).json({ error: 'pictogramIds required' });
    }

    const { rows } = await query(
      `INSERT INTO generated_phrases (user_id, pictogram_ids, phrase_length, phrase_text)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.user.id, JSON.stringify(pictogramIds), pictogramIds.length, phraseText]
    );

    // Log usage event
    await query(
      `INSERT INTO usage_events (user_id, event_type, details)
       VALUES ($1, 'phrase_built', $2)`,
      [req.user.id, JSON.stringify({ length: pictogramIds.length })]
    );

    res.status(201).json(rows[0]);
  } catch (e) { next(e); }
});

// GET /api/phrases?childId=&limit=20
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const childId = req.query.childId || req.user.id;
    const limit   = Math.min(parseInt(req.query.limit) || 20, 100);

    const { rows } = await query(
      `SELECT * FROM generated_phrases
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [childId, limit]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
