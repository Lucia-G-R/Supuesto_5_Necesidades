// Niveles 1..10 con curva creciente
export const LEVEL_THRESHOLDS = [0, 25, 60, 110, 180, 270, 380, 520, 700, 1000];

// Recompensas por hito de nivel (mostradas en Achievements)
export const LEVEL_REWARDS = {
  1: { emoji: '🫧', name: 'Burbujín' },
  2: { emoji: '🔥', name: 'Llamita' },
  3: { emoji: '⭐', name: 'Estrellux' },
  4: { emoji: '🦋', name: 'Aletita' },
  5: { emoji: '🌈', name: 'Arcorín' },
  6: { emoji: '🍄', name: 'Fungito' },
  7: { emoji: '🐢', name: 'Tortulín' },
  8: { emoji: '🐲', name: 'Dragoncito' },
  9: { emoji: '🐙', name: 'Pulgito' },
  10:{ emoji: '🦄', name: 'Unicornio' },
};

// Reglas de estrellas, expuestas también al cliente vía /api/progress/rules
export const STAR_RULES = [
  { action: 'phrase_1',           label: 'Frase de 1 pictograma',  stars: 2 },
  { action: 'phrase_2_3',         label: 'Frase de 2 o 3 pictogramas', stars: 5 },
  { action: 'phrase_4_plus',      label: 'Frase de 4 o más pictogramas', stars: 8 },
  { action: 'emotion_strategy',   label: 'Elegir una estrategia emocional', stars: 10 },
  { action: 'schedule_advance',   label: 'Completar un paso de la agenda', stars: 15 },
  { action: 'streak_bonus',       label: 'Día completo con uso (≥3 acciones)', stars: 20 },
];

export function levelFromStars(stars) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (stars >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export function nextThreshold(level) {
  // null si ya está en nivel máximo
  return LEVEL_THRESHOLDS[level] ?? null;
}

export function starsForPhrase(length) {
  if (length >= 4) return 8;
  if (length >= 2) return 5;
  return 2;
}

export const STARS_EMOTION_STRATEGY = 10;
export const STARS_SCHEDULE_ADVANCE = 15;
export const STARS_DAILY_STREAK     = 20;
