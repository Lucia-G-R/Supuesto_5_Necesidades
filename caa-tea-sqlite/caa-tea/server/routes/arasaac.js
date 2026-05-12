import { Router } from 'express';

const router = Router();
const ARASAAC_API = 'https://api.arasaac.org/v1';

// GET /api/arasaac/search?q=comer&lang=es
// Si exact=1, prioriza pictogramas cuyo array de keywords contiene el término EXACTAMENTE.
// Esto evita que "feliz" devuelva primero "contento" (sinónimo).
router.get('/search', async (req, res, next) => {
  try {
    const { q, lang = 'es' } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });

    const resp = await fetch(
      `${ARASAAC_API}/pictograms/${lang}/search/${encodeURIComponent(q)}`
    );
    if (!resp.ok) return res.status(resp.status).json({ error: 'ARASAAC error' });

    const data = await resp.json();
    const qLower = q.toLowerCase().trim();

    // Re-ordenar: primero los pictogramas cuyo array de keywords incluya el término exacto.
    data.sort((a, b) => {
      const aExact = (a.keywords || []).some(k => (k.keyword || '').toLowerCase() === qLower) ? 1 : 0;
      const bExact = (b.keywords || []).some(k => (k.keyword || '').toLowerCase() === qLower) ? 1 : 0;
      return bExact - aExact;
    });

    const pictograms = data.slice(0, 30).map(p => {
      // El "label" devuelto al cliente es el keyword del propio picto que coincide
      // con la búsqueda; si no hay coincidencia exacta, el primer keyword del picto.
      const exact = (p.keywords || []).find(k => (k.keyword || '').toLowerCase() === qLower);
      const label = exact?.keyword || p.keywords?.[0]?.keyword || q;
      return {
        id:       p._id,
        label,
        imageUrl: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`,
        category: p.categories?.[0] || 'general',
        exactMatch: !!exact,
      };
    });

    res.json(pictograms);
  } catch (e) { next(e); }
});

// GET /api/arasaac/categories?lang=es
router.get('/categories', async (req, res, next) => {
  try {
    const { lang = 'es' } = req.query;
    const resp = await fetch(`${ARASAAC_API}/categories/${lang}`);
    const data = await resp.json();
    res.json(data);
  } catch (e) { next(e); }
});

export default router;
