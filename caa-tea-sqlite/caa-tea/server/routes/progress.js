import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getProgress } from '../utils/progress.js';
import { LEVEL_THRESHOLDS, LEVEL_REWARDS, STAR_RULES } from '../utils/levels.js';

const router = Router();

// Reglas (para mostrar al usuario en Achievements)
router.get('/rules', (_req, res) => {
  res.json({
    levels: LEVEL_THRESHOLDS.map((threshold, i) => ({
      level: i + 1,
      threshold,
      reward: LEVEL_REWARDS[i + 1],
    })),
    starRules: STAR_RULES,
  });
});

// Progreso del niño
router.get('/:childId', requireAuth, (req, res) => {
  const childId = req.params.childId;
  // Niño solo puede ver el suyo, adulto puede ver cualquiera de sus hijos
  if (req.user.role === 'child' && req.user.id !== childId) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  res.json(getProgress(childId));
});

export default router;
