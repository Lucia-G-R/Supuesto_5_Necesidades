import { Router } from 'express';
import db, { uuid } from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';

const router = Router();

router.get('/:childId/today', requireAuth, (req, res) => {
  try {
    const row = db.get(`SELECT * FROM schedules WHERE child_id=? AND date=date('now')`, [req.params.childId]);
    if (row) {
      row.slot_now   = row.slot_now   ? JSON.parse(row.slot_now)   : null;
      row.slot_next  = row.slot_next  ? JSON.parse(row.slot_next)  : null;
      row.slot_later = row.slot_later ? JSON.parse(row.slot_later) : null;
    }
    res.json(row || null);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.put('/:childId', requireAuth, requireAdult, (req, res) => {
  try {
    const { slotNow, slotNext, slotLater } = req.body;
    const existing = db.get(`SELECT id FROM schedules WHERE child_id=? AND date=date('now')`, [req.params.childId]);
    if (existing) {
      db.run(`UPDATE schedules SET slot_now=?,slot_next=?,slot_later=?,updated_at=datetime('now') WHERE id=?`,
        [JSON.stringify(slotNow), JSON.stringify(slotNext), JSON.stringify(slotLater), existing.id]);
      return res.json({ id: existing.id });
    }
    const id = uuid();
    db.run(`INSERT INTO schedules (id,child_id,date,slot_now,slot_next,slot_later) VALUES (?,?,date('now'),?,?,?)`,
      [id, req.params.childId, JSON.stringify(slotNow), JSON.stringify(slotNext), JSON.stringify(slotLater)]);
    res.json({ id });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:childId/advance', requireAuth, (req, res) => {
  try {
    const row = db.get(`SELECT * FROM schedules WHERE child_id=? AND date=date('now')`, [req.params.childId]);
    if (!row) return res.status(404).json({ error: 'Sin agenda hoy' });
    const slotNow  = row.slot_now  ? { ...JSON.parse(row.slot_now),  completed: true  } : null;
    const slotNext = row.slot_next ? { ...JSON.parse(row.slot_next), completed: false } : null;
    const slotLater= row.slot_later ? JSON.parse(row.slot_later) : null;
    db.run(`UPDATE schedules SET slot_now=?,slot_next=?,slot_later=?,updated_at=datetime('now') WHERE id=?`,
      [JSON.stringify(slotNow), JSON.stringify(slotNext), JSON.stringify(slotLater), row.id]);
    res.json({ slot_now: slotNow, slot_next: slotNext, slot_later: slotLater });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
