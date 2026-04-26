import { Router } from 'express';
import db from '../db/sqlite.js';
import { requireAuth, requireAdult } from '../middleware/auth.js';

const router = Router();

const SOCIAL_CATEGORIES = new Set(['familia', 'personas', 'sentir']);
const SOCIAL_LABELS = new Set([
  'por favor', 'gracias', 'perdona', 'ayuda', 'compartir',
  'hola', 'adiós', 'sí', 'no', 'pedir ayuda',
]);

function isSocialPicto(p) {
  const cat = (p.category || '').toLowerCase();
  const label = (p.label || p.l || '').toLowerCase();
  return SOCIAL_CATEGORIES.has(cat) || SOCIAL_LABELS.has(label);
}

function safeParseArray(json) {
  try { const v = JSON.parse(json); return Array.isArray(v) ? v : []; }
  catch { return []; }
}

router.get('/:childId', requireAuth, requireAdult, (req, res) => {
  const childId = req.params.childId;
  const days  = parseInt(req.query.days)  || 30;
  const weeks = parseInt(req.query.weeks) || 8;

  // ── 1. PROGRESO DE COMUNICACIÓN (pictos vs palabras por semana) ──
  const communicationProgress = db.prepare(
    `SELECT strftime('%Y-%W', created_at) as week,
            COALESCE(SUM(phrase_length),0) as pictos,
            COUNT(*) as words
     FROM generated_phrases
     WHERE user_id=? AND created_at >= datetime('now','-'||?||' days')
     GROUP BY week ORDER BY week`
  ).all(childId, weeks * 7);

  // ── 2. USO DE LA APP (diario/semanal/mensual) ──
  // Diario (30 días)
  const usageDaily = db.prepare(
    `SELECT date(created_at) as date,
            COUNT(*) as events,
            COALESCE(SUM(CAST(json_extract(details,'$.duration_sec') AS INTEGER)),0) as duration_sec
     FROM usage_events
     WHERE user_id=? AND created_at >= datetime('now','-30 days')
     GROUP BY date ORDER BY date`
  ).all(childId);

  // Semanal (12 semanas)
  const usageWeekly = db.prepare(
    `SELECT strftime('%Y-%W', created_at) as week,
            COUNT(*) as events,
            COALESCE(SUM(CAST(json_extract(details,'$.duration_sec') AS INTEGER)),0) as duration_sec
     FROM usage_events
     WHERE user_id=? AND created_at >= datetime('now','-84 days')
     GROUP BY week ORDER BY week`
  ).all(childId);

  // Mensual (12 meses)
  const usageMonthly = db.prepare(
    `SELECT strftime('%Y-%m', created_at) as month,
            COUNT(*) as events,
            COALESCE(SUM(CAST(json_extract(details,'$.duration_sec') AS INTEGER)),0) as duration_sec
     FROM usage_events
     WHERE user_id=? AND created_at >= datetime('now','-365 days')
     GROUP BY month ORDER BY month`
  ).all(childId);

  // ── 3. TIPO DE COMUNICACIÓN (1 picto vs 2+ pictos por semana) ──
  const communicationType = db.prepare(
    `SELECT strftime('%Y-%W', created_at) as week,
            SUM(CASE WHEN phrase_length=1 THEN 1 ELSE 0 END) as single,
            SUM(CASE WHEN phrase_length>1 THEN 1 ELSE 0 END) as multi
     FROM generated_phrases
     WHERE user_id=? AND created_at >= datetime('now','-'||?||' days')
     GROUP BY week ORDER BY week`
  ).all(childId, weeks * 7);

  // ── 4. ERRORES Y TIEMPO DE RESPUESTA ──
  const responseMsByWeek = db.prepare(
    `SELECT strftime('%Y-%W', created_at) as week,
            ROUND(AVG(CAST(json_extract(details,'$.ms') AS INTEGER))) as avgMs,
            COUNT(*) as samples
     FROM usage_events
     WHERE user_id=? AND event_type='picto_response_ms'
       AND created_at >= datetime('now','-'||?||' days')
     GROUP BY week ORDER BY week`
  ).all(childId, weeks * 7);

  const errors = db.prepare(
    `SELECT
       SUM(CASE WHEN event_type='picto_removed' THEN 1 ELSE 0 END) as pictos_removed,
       SUM(CASE WHEN event_type='phrase_cleared' THEN 1 ELSE 0 END) as phrases_cleared,
       COUNT(*) as total
     FROM usage_events
     WHERE user_id=? AND event_type IN ('picto_removed','phrase_cleared')
       AND created_at >= datetime('now','-'||?||' days')`
  ).get(childId, days);

  const errorsAndTime = {
    responseMsByWeek,
    errorCount: errors?.total || 0,
    pictosRemoved: errors?.pictos_removed || 0,
    phrasesCleared: errors?.phrases_cleared || 0,
  };

  // ── 5. INTERACCIÓN SOCIAL + 6. TOP PICTOGRAMAS (parseo en JS) ──
  const phrases = db.prepare(
    `SELECT pictogram_ids, created_at FROM generated_phrases
     WHERE user_id=? AND created_at >= datetime('now','-'||?||' days')`
  ).all(childId, weeks * 7);

  // Aggregadores
  const socialByWeek = new Map(); // week -> { social, total }
  const pictoCount   = new Map(); // id -> { id, label, count, imageUrl, category }

  for (const p of phrases) {
    const pictos = safeParseArray(p.pictogram_ids);
    const week = weekKey(p.created_at);
    const slot = socialByWeek.get(week) || { week, social: 0, total: 0 };

    for (const pic of pictos) {
      const id = pic.id ?? pic.pictoId;
      if (!id) continue;
      slot.total += 1;
      if (isSocialPicto(pic)) slot.social += 1;
      const key = String(id);
      const prev = pictoCount.get(key) || {
        id,
        label: pic.label || pic.l || '',
        count: 0,
        imageUrl: `https://static.arasaac.org/pictograms/${id}/${id}_300.png`,
        category: pic.category || null,
      };
      prev.count += 1;
      // si llega un label más explícito, lo guardamos
      if (!prev.label && (pic.label || pic.l)) prev.label = pic.label || pic.l;
      pictoCount.set(key, prev);
    }
    socialByWeek.set(week, slot);
  }

  const socialInteraction = [...socialByWeek.values()].sort((a, b) => a.week.localeCompare(b.week));
  const topPictograms = [...pictoCount.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // ── (extras útiles para mantener compatibilidad con vistas previas) ──
  const emotStats = db.prepare(
    `SELECT COUNT(*) as total_logs,
            SUM(CASE WHEN strategy_chosen IS NOT NULL THEN 1 ELSE 0 END) as autonomous_logs
     FROM emotional_logs WHERE user_id=? AND created_at >= datetime('now','-'||?||' days')`
  ).get(childId, days);

  const emotionalAutonomy = {
    total_logs: emotStats?.total_logs || 0,
    autonomous_logs: emotStats?.autonomous_logs || 0,
    autonomy_rate: emotStats?.total_logs
      ? Math.round((emotStats.autonomous_logs / emotStats.total_logs) * 1000) / 10
      : 0,
  };

  res.json({
    communicationProgress,
    appUsage: { daily: usageDaily, weekly: usageWeekly, monthly: usageMonthly },
    communicationType,
    errorsAndTime,
    socialInteraction,
    topPictograms,
    emotionalAutonomy,
    rangeDays: days,
    rangeWeeks: weeks,
  });
});

function weekKey(isoDate) {
  // 'YYYY-WW' from "YYYY-MM-DD HH:MM:SS"
  const d = new Date(isoDate.replace(' ', 'T') + 'Z');
  const onejan = new Date(d.getUTCFullYear(), 0, 1);
  const w = Math.ceil(((d - onejan) / 86_400_000 + onejan.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-${String(w).padStart(2, '0')}`;
}

export default router;
