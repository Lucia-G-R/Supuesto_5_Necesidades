import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';

const router = Router();

// GET /api/schedule/:childId/today
router.get('/:childId/today', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT * FROM schedules
       WHERE child_id=$1 AND date=CURRENT_DATE`,
      [req.params.childId]
    );
    res.json(rows[0] || null);
  } catch (e) { next(e); }
});

// PUT /api/schedule/:childId  (adult configures slots)
router.put('/:childId', requireAuth, requireAdult, async (req, res, next) => {
  try {
    const { slotNow, slotNext, slotLater } = req.body;
    const { rows } = await query(
      `INSERT INTO schedules (child_id, date, slot_now, slot_next, slot_later)
       VALUES ($1, CURRENT_DATE, $2, $3, $4)
       ON CONFLICT (child_id, date) DO UPDATE SET
         slot_now   = EXCLUDED.slot_now,
         slot_next  = EXCLUDED.slot_next,
         slot_later = EXCLUDED.slot_later,
         updated_at = NOW()
       RETURNING *`,
      [req.params.childId,
       JSON.stringify(slotNow),
       JSON.stringify(slotNext),
       JSON.stringify(slotLater)]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// PATCH /api/schedule/:childId/advance  (mark current slot done, advance)
router.patch('/:childId/advance', requireAuth, async (req, res, next) => {
  try {
    const { rows: [sched] } = await query(
      `SELECT * FROM schedules WHERE child_id=$1 AND date=CURRENT_DATE`,
      [req.params.childId]
    );
    if (!sched) return res.status(404).json({ error: 'No schedule for today' });

    const now    = { ...sched.slot_now,   completed: true };
    const next   = { ...sched.slot_next,  completed: false };
    const later  = sched.slot_later;

    const { rows } = await query(
      `UPDATE schedules SET slot_now=$1, slot_next=$2, slot_later=$3, updated_at=NOW()
       WHERE child_id=$4 AND date=CURRENT_DATE RETURNING *`,
      [JSON.stringify(now), JSON.stringify(next), JSON.stringify(later), req.params.childId]
    );

    await query(
      `INSERT INTO usage_events (user_id, event_type, details) VALUES ($1,'schedule_advanced',$2)`,
      [req.params.childId, JSON.stringify({ slot: 'now' })]
    );

    res.json(rows[0]);
  } catch (e) { next(e); }
});

export default router;
