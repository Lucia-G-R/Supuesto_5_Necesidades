import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';

const router = Router();

// GET /api/users/children  (adult sees their linked children)
router.get('/children', requireAuth, requireAdult, async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.avatar_color, u.created_at
       FROM users u
       JOIN adult_child_links l ON l.child_id = u.id
       WHERE l.adult_id = $1
       ORDER BY u.name`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// GET /api/users/all-children  (list all children for child-select screen)
router.get('/all-children', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, name, avatar_color FROM users WHERE role='child' ORDER BY name`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

export default router;
