import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';

const router = Router();

router.get('/:childId', requireAuth, requireAdult, (req, res) => {
  try {
    const { childId } = req.params;
    const days  = parseInt(req.query.days)  || 30;
    const weeks = parseInt(req.query.weeks) || 8;

    const lmfSeries = db.all(
      `SELECT strftime('%Y-%W',created_at) as week,
              ROUND(AVG(phrase_length),2) as lmf, COUNT(*) as total_phrases
       FROM generated_phrases WHERE user_id=?
       GROUP BY week ORDER BY week DESC LIMIT ?`, [childId, weeks]
    );

    const diversity = db.get(
      `SELECT COUNT(*) as count FROM generated_phrases
       WHERE user_id=? AND created_at >= datetime('now','-'||?||' days')`, [childId, days]
    );

    const frequency = db.all(
      `SELECT strftime('%Y-%W',created_at) as week,
              COUNT(DISTINCT date(created_at)) as active_days
       FROM usage_events WHERE user_id=?
       GROUP BY week ORDER BY week DESC LIMIT ?`, [childId, weeks]
    );

    const emotStats = db.get(
      `SELECT COUNT(*) as total_logs,
              SUM(CASE WHEN strategy_chosen IS NOT NULL THEN 1 ELSE 0 END) as autonomous_logs
       FROM emotional_logs WHERE user_id=?
       AND created_at >= datetime('now','-'||?||' days')`, [childId, days]
    ) || { total_logs: 0, autonomous_logs: 0 };

    const emotionDistribution = db.all(
      `SELECT emotion, COUNT(*) as count FROM emotional_logs
       WHERE user_id=? AND created_at >= datetime('now','-'||?||' days')
       GROUP BY emotion ORDER BY count DESC`, [childId, days]
    );

    res.json({
      lmfSeries: lmfSeries.reverse(),
      diversity: { count: diversity?.count || 0, periodDays: days },
      frequency: frequency.reverse(),
      emotionalAutonomy: {
        ...emotStats,
        autonomy_rate: emotStats.total_logs > 0
          ? Math.round((emotStats.autonomous_logs / emotStats.total_logs) * 1000) / 10
          : 0,
      },
      emotionDistribution,
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

export default router;
