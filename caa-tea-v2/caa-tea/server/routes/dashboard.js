import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';

const router = Router();

// GET /api/dashboard/:childId?weeks=8&days=30
router.get('/:childId', requireAuth, requireAdult, async (req, res, next) => {
  try {
    const childId = req.params.childId;
    const weeks   = parseInt(req.query.weeks) || 8;
    const days    = parseInt(req.query.days)  || 30;

    // KPI 1: LMF semanal
    const { rows: lmfRows } = await query(
      `SELECT
         DATE_TRUNC('week', created_at) AS week,
         ROUND(AVG(phrase_length), 2)   AS lmf,
         COUNT(*)                        AS total_phrases
       FROM generated_phrases
       WHERE user_id = $1
         AND created_at >= NOW() - ($2 || ' weeks')::INTERVAL
       GROUP BY week
       ORDER BY week`,
      [childId, weeks]
    );

    // KPI 2: Diversidad léxica (pictogramas únicos en últimos N días)
    const { rows: divRows } = await query(
      `SELECT COUNT(DISTINCT elem->>'id') AS unique_pictograms
       FROM generated_phrases,
            jsonb_array_elements(pictogram_ids) AS elem
       WHERE user_id = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL`,
      [childId, days]
    );

    // KPI 3: Días activos por semana
    const { rows: freqRows } = await query(
      `SELECT
         DATE_TRUNC('week', created_at)   AS week,
         COUNT(DISTINCT DATE(created_at)) AS active_days
       FROM usage_events
       WHERE user_id = $1
         AND created_at >= NOW() - ($2 || ' weeks')::INTERVAL
       GROUP BY week
       ORDER BY week`,
      [childId, weeks]
    );

    // KPI 4: Autonomía emocional
    const { rows: autoRows } = await query(
      `SELECT
         COUNT(*)                                              AS total_logs,
         COUNT(*) FILTER (WHERE strategy_chosen IS NOT NULL)  AS autonomous_logs,
         ROUND(
           100.0 * COUNT(*) FILTER (WHERE strategy_chosen IS NOT NULL)
           / NULLIF(COUNT(*), 0), 1
         )                                                    AS autonomy_rate
       FROM emotional_logs
       WHERE user_id    = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL`,
      [childId, days]
    );

    // Distribución de emociones (para donut chart)
    const { rows: emotionDist } = await query(
      `SELECT emotion, COUNT(*) AS count
       FROM emotional_logs
       WHERE user_id = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL
       GROUP BY emotion ORDER BY count DESC`,
      [childId, days]
    );

    // Uso por categorías de pictogramas
    const { rows: catRows } = await query(
      `SELECT elem->>'category' AS category, COUNT(*) AS count
       FROM generated_phrases,
            jsonb_array_elements(pictogram_ids) AS elem
       WHERE user_id = $1
         AND created_at >= NOW() - ($2 || ' days')::INTERVAL
         AND elem->>'category' IS NOT NULL
       GROUP BY category ORDER BY count DESC
       LIMIT 8`,
      [childId, days]
    );

    res.json({
      lmfSeries:          lmfRows,
      diversity:          { count: parseInt(divRows[0]?.unique_pictograms) || 0, periodDays: days },
      frequency:          freqRows,
      emotionalAutonomy:  autoRows[0],
      emotionDistribution: emotionDist,
      categoryUsage:      catRows,
    });
  } catch (e) { next(e); }
});

export default router;
