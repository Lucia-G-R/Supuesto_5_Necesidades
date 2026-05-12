import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';
import { randomUUID } from 'crypto';
import { awardStars } from '../utils/progress.js';
import { STARS_SCHEDULE_ADVANCE } from '../utils/levels.js';

const router = Router();

function parseSlot(raw) {
  if (raw === null || raw === undefined || raw === 'null' || raw === '') return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function slotToDb(slot) {
  return slot ? JSON.stringify(slot) : null;
}

router.get('/:childId/today', requireAuth, (req, res) => {
  const row = db.prepare(
    "SELECT * FROM schedules WHERE child_id=? AND date=date('now')"
  ).get(req.params.childId);
  if (row) {
    row.slot_now   = parseSlot(row.slot_now);
    row.slot_next  = parseSlot(row.slot_next);
    row.slot_later = parseSlot(row.slot_later);
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
    ).run(slotToDb(slotNow), slotToDb(slotNext), slotToDb(slotLater), existing.id);
    return res.json({ id: existing.id });
  }
  const id = randomUUID();
  db.prepare(
    "INSERT INTO schedules (id,child_id,date,slot_now,slot_next,slot_later) VALUES (?,?,date('now'),?,?,?)"
  ).run(id, req.params.childId, slotToDb(slotNow), slotToDb(slotNext), slotToDb(slotLater));
  res.json({ id });
});

router.patch('/:childId/advance', requireAuth, (req, res) => {
  const row = db.prepare(
    "SELECT * FROM schedules WHERE child_id=? AND date=date('now')"
  ).get(req.params.childId);
  if (!row) return res.status(404).json({ error: 'Sin agenda hoy' });

  const slots = {
    now:   parseSlot(row.slot_now),
    next:  parseSlot(row.slot_next),
    later: parseSlot(row.slot_later),
  };

  // Marca el siguiente bloque pendiente como completado SIN reordenar los huecos.
  // Así el niño ve cada tarea con su ✓ en su slot (AHORA / DESPUÉS / LUEGO)
  // y el botón pasa al siguiente automáticamente.
  let completedKey = null;
  let completedLabel = null;
  for (const key of ['now', 'next', 'later']) {
    if (slots[key] && !slots[key].completed) {
      completedLabel = slots[key].label || null;
      slots[key] = { ...slots[key], completed: true };
      completedKey = key;
      break;
    }
  }

  if (completedKey) {
    db.prepare(
      "UPDATE schedules SET slot_now=?,slot_next=?,slot_later=?,updated_at=datetime('now') WHERE id=?"
    ).run(slotToDb(slots.now), slotToDb(slots.next), slotToDb(slots.later), row.id);

    db.prepare('INSERT INTO usage_events (id,user_id,event_type,details) VALUES (?,?,?,?)')
      .run(randomUUID(), req.params.childId, 'schedule_advanced', JSON.stringify({ slot: completedLabel, slot_key: completedKey }));
  }

  let progress = null;
  if (completedKey && req.user.role === 'child' && req.user.id === req.params.childId) {
    progress = awardStars(req.user.id, STARS_SCHEDULE_ADVANCE);
  }

  res.json({ slot_now: slots.now, slot_next: slots.next, slot_later: slots.later, progress });
});

export default router;