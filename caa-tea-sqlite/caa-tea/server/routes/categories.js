import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';
import { randomUUID } from 'crypto';

const router = Router();

// GET /api/categories/:childId
// Devuelve secciones personalizadas + pictogramas añadidos (de built-in o custom).
router.get('/:childId', requireAuth, (req, res) => {
  const { childId } = req.params;
  if (req.user.role === 'child' && req.user.id !== childId) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const customCategories = db.prepare(
    'SELECT id, label, color, bg FROM custom_categories WHERE child_id=? ORDER BY label'
  ).all(childId);

  const rows = db.prepare(
    `SELECT id, category_id, picto_id, label, image_url, created_at
     FROM category_pictograms WHERE child_id=? ORDER BY category_id, created_at`
  ).all(childId);

  const pictograms = rows.map(r => ({
    id:        r.id,
    categoryId: r.category_id,
    pictoId:   r.picto_id,
    label:     r.label,
    imageUrl:  r.image_url,
  }));

  res.json({ customCategories, pictograms });
});

// POST /api/categories   { childId, label, color?, bg? }
router.post('/', requireAuth, requireAdult, (req, res) => {
  const { childId, label, color, bg } = req.body || {};
  if (typeof childId !== 'string' || !childId) {
    return res.status(400).json({ error: 'childId requerido' });
  }
  if (typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'label requerido' });
  }
  const id = randomUUID();
  const finalColor = (typeof color === 'string' && color) ? color : '#534AB7';
  const finalBg    = (typeof bg === 'string' && bg) ? bg : '#EEE8FF';
  db.prepare(
    'INSERT INTO custom_categories (id,child_id,label,color,bg) VALUES (?,?,?,?,?)'
  ).run(id, childId, label.trim(), finalColor, finalBg);
  res.status(201).json({ id, label: label.trim(), color: finalColor, bg: finalBg });
});

// DELETE /api/categories/:categoryId   (solo aplica a custom; built-in no se borran)
router.delete('/:categoryId', requireAuth, requireAdult, (req, res) => {
  const { categoryId } = req.params;
  db.prepare('DELETE FROM category_pictograms WHERE category_id=?').run(categoryId);
  db.prepare('DELETE FROM custom_categories WHERE id=?').run(categoryId);
  res.json({ ok: true });
});

// POST /api/categories/:categoryId/pictograms
// { childId, pictoId, label, imageUrl }
router.post('/:categoryId/pictograms', requireAuth, requireAdult, (req, res) => {
  const { categoryId } = req.params;
  const { childId, pictoId, label, imageUrl } = req.body || {};
  if (typeof childId !== 'string' || !childId) {
    return res.status(400).json({ error: 'childId requerido' });
  }
  const pictoNum = Number(pictoId);
  if (!Number.isFinite(pictoNum) || pictoNum <= 0) {
    return res.status(400).json({ error: 'pictoId inválido' });
  }
  if (typeof label !== 'string' || !label.trim()) {
    return res.status(400).json({ error: 'label requerido' });
  }
  if (typeof imageUrl !== 'string' || !imageUrl) {
    return res.status(400).json({ error: 'imageUrl requerido' });
  }
  const id = randomUUID();
  try {
    db.prepare(
      'INSERT INTO category_pictograms (id,child_id,category_id,picto_id,label,image_url) VALUES (?,?,?,?,?,?)'
    ).run(id, childId, categoryId, pictoNum, label.trim(), imageUrl);
  } catch (e) {
    return res.status(409).json({ error: 'Pictograma ya añadido a esa sección' });
  }
  res.status(201).json({ id, categoryId, pictoId: pictoNum, label: label.trim(), imageUrl });
});

// DELETE /api/categories/pictograms/:entryId
router.delete('/pictograms/:entryId', requireAuth, requireAdult, (req, res) => {
  const { entryId } = req.params;
  db.prepare('DELETE FROM category_pictograms WHERE id=?').run(entryId);
  res.json({ ok: true });
});

export default router;
