import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/sqlite.js';

const router = Router();

// POST /api/auth/child-login  { childId }
router.post('/child-login', (req, res) => {
  const { childId } = req.body || {};
  if (typeof childId !== 'string' || !childId) {
    return res.status(400).json({ error: 'childId requerido' });
  }
  const user = db.prepare(`SELECT id,name,role,avatar_color FROM users WHERE id=? AND role='child'`).get(childId);
  if (!user) return res.status(404).json({ error: 'Niño no encontrado' });
  const token = jwt.sign({ id:user.id, name:user.name, role:user.role }, process.env.JWT_SECRET||'dev_secret', { expiresIn:'12h' });
  res.json({ token, user });
});

// POST /api/auth/adult-login  { userId, pin }
router.post('/adult-login', async (req, res) => {
  const { userId, pin } = req.body || {};
  if (typeof userId !== 'string' || !userId) {
    return res.status(400).json({ error: 'userId requerido' });
  }
  if (pin == null || (typeof pin !== 'string' && typeof pin !== 'number')) {
    return res.status(400).json({ error: 'pin requerido' });
  }
  const user = db.prepare(`SELECT id,name,role,pin_hash,avatar_color FROM users WHERE id=? AND role='adult'`).get(userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  if (!user.pin_hash) return res.status(401).json({ error: 'PIN incorrecto' });
  const ok = await bcrypt.compare(String(pin), user.pin_hash);
  if (!ok) return res.status(401).json({ error: 'PIN incorrecto' });
  const token = jwt.sign({ id:user.id, name:user.name, role:user.role }, process.env.JWT_SECRET||'dev_secret', { expiresIn:'4h' });
  const { pin_hash, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

export default router;
