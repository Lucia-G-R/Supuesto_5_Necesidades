import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/children', requireAuth, requireAdult, (req, res) => {
  const rows = db.prepare(
    `SELECT u.id,u.name,u.avatar_color,u.created_at FROM users u
     JOIN adult_child_links l ON l.child_id=u.id
     WHERE l.adult_id=? ORDER BY u.name`
  ).all(req.user.id);
  res.json(rows);
});

router.get('/all-children', (_req, res) => {
  const rows = db.prepare(`SELECT id,name,avatar_color FROM users WHERE role='child' ORDER BY name`).all();
  res.json(rows);
});

router.get('/all-adults', (_req, res) => {
  const rows = db.prepare(`SELECT id,name,avatar_color FROM users WHERE role='adult' ORDER BY name`).all();
  res.json(rows);
});

// Tracking genérico para latencia/errores/sesiones desde el cliente
router.post('/event', requireAuth, (req, res) => {
  const { event_type, details } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type requerido' });

  const id = randomUUID();
  db.prepare('INSERT INTO usage_events (id,user_id,event_type,details) VALUES (?,?,?,?)')
    .run(id, req.user.id, String(event_type), details ? JSON.stringify(details) : null);
  res.status(201).json({ id });
});

export default router;
