import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';

const router = Router();

// POST /api/auth/child-login  { childId }
router.post('/child-login', async (req, res, next) => {
  try {
    const { childId } = req.body;
    const { rows } = await query(
      `SELECT id, name, role, avatar_color FROM users WHERE id=$1 AND role='child'`,
      [childId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Child not found' });

    const user  = rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ token, user });
  } catch (e) { next(e); }
});

// POST /api/auth/adult-login  { userId, pin }
router.post('/adult-login', async (req, res, next) => {
  try {
    const { userId, pin } = req.body;
    const { rows } = await query(
      `SELECT id, name, role, pin_hash, avatar_color FROM users WHERE id=$1 AND role='adult'`,
      [userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];
    const ok   = await bcrypt.compare(String(pin), user.pin_hash);
    if (!ok) return res.status(401).json({ error: 'Wrong PIN' });

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '4h' }
    );
    delete user.pin_hash;
    res.json({ token, user });
  } catch (e) { next(e); }
});

export default router;
