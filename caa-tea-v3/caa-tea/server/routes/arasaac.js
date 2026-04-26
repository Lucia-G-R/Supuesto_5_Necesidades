import { Router } from 'express';

const router = Router();
const ARASAAC_API = 'https://api.arasaac.org/v1';

// GET /api/arasaac/search?q=comer&lang=es
router.get('/search', async (req, res, next) => {
  try {
    const { q, lang = 'es' } = req.query;
    if (!q) return res.status(400).json({ error: 'q required' });

    const resp = await fetch(
      `${ARASAAC_API}/pictograms/${lang}/search/${encodeURIComponent(q)}`
    );
    if (!resp.ok) return res.status(resp.status).json({ error: 'ARASAAC error' });

    const data = await resp.json();

    // Normalizar respuesta: devolver solo lo necesario
    const pictograms = data.slice(0, 30).map(p => ({
      id:       p._id,
      label:    p.keywords?.[0]?.keyword || q,
      imageUrl: `https://static.arasaac.org/pictograms/${p._id}/${p._id}_300.png`,
      category: p.categories?.[0] || 'general',
    }));

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
