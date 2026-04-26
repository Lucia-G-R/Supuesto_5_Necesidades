import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db/sqlite.js';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'caa_tea_dev_secret';

router.post('/child-login', (req, res) => {
  try {
    const { childId } = req.body;
    const user = db.get(`SELECT id,name,role,avatar_color FROM users WHERE id=? AND role='child'`, [childId]);
    if (!user) return res.status(404).json({ error: 'Niño no encontrado' });
    const token = jwt.sign({ id:user.id, name:user.name, role:user.role }, SECRET, { expiresIn:'12h' });
    res.json({ token, user });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

router.post('/adult-login', async (req, res) => {
  try {
    const { userId, pin } = req.body;
    const user = db.get(`SELECT id,name,role,pin_hash,avatar_color FROM users WHERE id=? AND role='adult'`, [userId]);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    const ok = await bcrypt.compare(String(pin), user.pin_hash);
    if (!ok) return res.status(401).json({ error: 'PIN incorrecto' });
    const token = jwt.sign({ id:user.id, name:user.name, role:user.role }, SECRET, { expiresIn:'4h' });
    const { pin_hash, ...safe } = user;
    res.json({ token, user: safe });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
