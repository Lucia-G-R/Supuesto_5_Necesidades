import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import { awardStars } from '../utils/progress.js';
import { STARS_SCHEDULE_ADVANCE } from '../utils/levels.js';

const router = Router();

router.get('/:childId/today', requireAuth, (req, res) => {
  const row = db.prepare(
    "SELECT * FROM schedules WHERE child_id=? AND date=date('now')"
  ).get(req.params.childId);
  if (row) {
    row.slot_now   = row.slot_now   ? JSON.parse(row.slot_now)   : null;
    row.slot_next  = row.slot_next  ? JSON.parse(row.slot_next)  : null;
    row.slot_later = row.slot_later ? JSON.parse(row.slot_later) : null;
  }
  res.json(row || null);
});

router.put('/:childId', requireAuth, requireAdult, (req, res) => {
  const { slotNow, slotNext, slotLater } = req.body;
  const existing = db.prepare(
    "SELECT id FROM schedules WHERE child_id=? AND date=date('now')"
  ).get(req.params.childId);

  if (existing) {
    db.prepare(
      "UPDATE schedules SET slot_now=?,slot_next=?,slot_later=?,updated_at=datetime('now') WHERE id=?"
    ).run(JSON.stringify(slotNow), JSON.stringify(slotNext), JSON.stringify(slotLater), existing.id);
    return res.json({ id: existing.id });
  }
  const id = randomUUID();
  db.prepare(
    "INSERT INTO schedules (id,child_id,date,slot_now,slot_next,slot_later) VALUES (?,?,date('now'),?,?,?)"
  ).run(id, req.params.childId, JSON.stringify(slotNow), JSON.stringify(slotNext), JSON.stringify(slotLater));
  res.json({ id });
});

router.patch('/:childId/advance', requireAuth, (req, res) => {
  const row = db.prepare(
    "SELECT * FROM schedules WHERE child_id=? AND date=date('now')"
  ).get(req.params.childId);
  if (!row) return res.status(404).json({ error: 'Sin agenda hoy' });

  const slotNow  = row.slot_now  ? { ...JSON.parse(row.slot_now),  completed: true  } : null;
  const slotNext = row.slot_next ? { ...JSON.parse(row.slot_next), completed: false } : null;
  const slotLater= row.slot_later? JSON.parse(row.slot_later) : null;

  db.prepare(
    "UPDATE schedules SET slot_now=?,slot_next=?,slot_later=?,updated_at=datetime('now') WHERE id=?"
  ).run(JSON.stringify(slotNow), JSON.stringify(slotNext), JSON.stringify(slotLater), row.id);

  db.prepare('INSERT INTO usage_events (id,user_id,event_type,details) VALUES (?,?,?,?)')
    .run(randomUUID(), req.params.childId, 'schedule_advanced', JSON.stringify({ slot: slotNow?.label || null }));

  let progress = null;
  if (req.user.role === 'child' && req.user.id === req.params.childId) {
    progress = awardStars(req.user.id, STARS_SCHEDULE_ADVANCE);
  }

  res.json({ slot_now: slotNow, slot_next: slotNext, slot_later: slotLater, progress });
});

export default router;
