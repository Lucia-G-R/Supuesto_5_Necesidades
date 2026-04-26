import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';

const router = Router();

router.get('/all-children', (_req, res) => {
  try {
    res.json(db.all(`SELECT id,name,avatar_color FROM users WHERE role='child' ORDER BY name`));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/all-adults', (_req, res) => {
  try {
    res.json(db.all(`SELECT id,name,avatar_color FROM users WHERE role='adult' ORDER BY name`));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.get('/children', requireAuth, requireAdult, (req, res) => {
  try {
    const rows = db.all(
      `SELECT u.id,u.name,u.avatar_color FROM users u
       JOIN adult_child_links l ON l.child_id=u.id
       WHERE l.adult_id=? ORDER BY u.name`, [req.user.id]
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;