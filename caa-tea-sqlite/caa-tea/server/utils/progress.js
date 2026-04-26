import db from '../db/sqlite.js';
import { levelFromStars, nextThreshold, STARS_DAILY_STREAK } from './levels.js';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayStr() {
  return new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
}

function ensureRow(childId) {
  let row = db.prepare('SELECT * FROM child_progress WHERE child_id=?').get(childId);
  if (!row) {
    db.prepare(
      'INSERT INTO child_progress (child_id,total_stars,level,last_active_date,streak_days) VALUES (?,?,?,?,?)'
    ).run(childId, 0, 1, null, 0);
    row = db.prepare('SELECT * FROM child_progress WHERE child_id=?').get(childId);
  }
  return row;
}

// Llamada por cada acción que otorga estrellas. Devuelve el progreso actualizado.
export function awardStars(childId, gained) {
  const row = ensureRow(childId);
  const today = todayStr();

  // Calcular racha
  let newStreak = row.streak_days || 0;
  if (row.last_active_date !== today) {
    if (row.last_active_date === yesterdayStr()) newStreak = (row.streak_days || 0) + 1;
    else newStreak = 1;
  }

  let newStars = (row.total_stars || 0) + gained;

  // Bonus de día completo: si hoy pasamos de tener <3 a tener >=3 acciones, sumar STARS_DAILY_STREAK
  // Para detectarlo, contamos eventos de hoy ANTES y DESPUÉS. Aquí, simplificamos: si la fila marcaba ayer
  // y hoy es el primer "award", y el conteo de acciones >=3 ya, sumamos. Como el award se llama por acción,
  // detectamos cuando cruza de 2 a 3 acciones hoy.
  const actionCountToday = countActionsToday(childId);
  if (actionCountToday === 3 && row.last_active_date === today) {
    // Es la 3ª acción del día: bonus
    newStars += STARS_DAILY_STREAK;
    gained += STARS_DAILY_STREAK;
  }

  const newLevel = levelFromStars(newStars);

  db.prepare(
    "UPDATE child_progress SET total_stars=?, level=?, last_active_date=?, streak_days=?, updated_at=datetime('now') WHERE child_id=?"
  ).run(newStars, newLevel, today, newStreak, childId);

  return {
    total_stars: newStars,
    level: newLevel,
    streak_days: newStreak,
    next_threshold: nextThreshold(newLevel),
    gained,
  };
}

function countActionsToday(childId) {
  const r = db
    .prepare(
      "SELECT COUNT(*) as n FROM usage_events WHERE user_id=? AND event_type IN ('phrase_built','emotion_logged','schedule_advanced') AND date(created_at)=date('now')"
    )
    .get(childId);
  return r.n;
}

export function getProgress(childId) {
  const row = ensureRow(childId);
  return {
    total_stars: row.total_stars,
    level: row.level,
    streak_days: row.streak_days,
    last_active_date: row.last_active_date,
    next_threshold: nextThreshold(row.level),
  };
}
