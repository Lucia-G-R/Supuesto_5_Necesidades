import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTTS } from '../../hooks/useTTS.js';
import { api } from '../../utils/api.js';

// Categorías declaradas SOLO por palabras-clave. Los IDs de ARASAAC se resuelven
// en runtime contra /api/arasaac/search y se cachean en localStorage. Así la
// imagen siempre coincide con la etiqueta.
const CATEGORIES = [
  {
    id: 'comida', label: 'Comida', color: '#E8A020', bg: '#FEF3D0',
    keywords: ['desayunar', 'comer', 'beber', 'agua', 'leche', 'pan', 'fruta',
               'manzana', 'plátano', 'pollo', 'arroz', 'sopa', 'queso', 'yogur', 'galleta'],
  },
  {
    id: 'acciones', label: 'Acciones', color: '#1D9E75', bg: '#C8F0E1',
    keywords: ['jugar', 'dormir', 'leer', 'dibujar', 'cantar', 'respirar', 'escuchar',
               'hablar', 'correr', 'saltar', 'caminar', 'escribir', 'colegio', 'ver televisión'],
  },
  {
    id: 'sentir', label: 'Sentir', color: '#D85A30', bg: '#FFEDED',
    keywords: ['feliz', 'triste', 'enfadado', 'asustado', 'calmado', 'sorprendido',
               'cansado', 'aburrido', 'hambre', 'sed', 'frío', 'calor', 'dolor', 'me gusta'],
  },
  {
    id: 'lugares', label: 'Lugares', color: '#4A90E2', bg: '#E3F0FF',
    keywords: ['casa', 'colegio', 'parque', 'tienda', 'baño', 'cocina', 'dormitorio',
               'salón', 'jardín', 'playa', 'piscina', 'médico', 'coche', 'autobús'],
  },
  {
    id: 'familia', label: 'Familia', color: '#7C5CFC', bg: '#EEE8FF',
    keywords: ['mamá', 'papá', 'abuela', 'abuelo', 'hermano', 'hermana', 'amigo',
               'amiga', 'profesor', 'médico', 'niño', 'niña', 'bebé', 'familia'],
  },
  {
    id: 'objetos', label: 'Objetos', color: '#D4920E', bg: '#FEF3D0',
    keywords: ['mochila', 'libro', 'lápiz', 'pelota', 'juguete', 'cama', 'silla',
               'mesa', 'televisión', 'teléfono', 'ropa', 'zapatos', 'música', 'papel'],
  },
  {
    id: 'higiene', label: 'Higiene', color: '#2E7DC4', bg: '#E3F0FF',
    keywords: ['ducha', 'lavarse', 'dientes', 'peine', 'jabón', 'toalla', 'váter',
               'lavar manos', 'vestirse', 'espejo', 'limpio', 'sucio', 'ordenar', 'limpiar'],
  },
  {
    id: 'tiempo', label: 'Tiempo', color: '#5A3FC0', bg: '#EEE8FF',
    keywords: ['ahora', 'después', 'antes', 'hoy', 'mañana', 'ayer', 'siempre',
               'nunca', 'tarde', 'noche', 'lunes', 'rápido', 'lento', 'esperar'],
  },
  {
    id: 'pedir', label: 'Pedir', color: '#A844A0', bg: '#FBEAF0',
    keywords: ['por favor', 'gracias', 'perdona', 'ayuda', 'sí', 'no', 'quiero',
               'no quiero', 'más', 'menos', 'compartir', 'hola', 'adiós', 'ayudar'],
  },
];

const ARASAAC_STATIC = 'https://static.arasaac.org/pictograms';
const CACHE_KEY = 'caa-pictos-v2';

function pictoUrl(id) { return `${ARASAAC_STATIC}/${id}/${id}_300.png`; }

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
  catch { return {}; }
}
function saveCache(c) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch {}
}

export default function PhraseBuilder({ childId, onProgress, giveReward }) {
  const [activeCat,    setActiveCat]    = useState(CATEGORIES[0]);
  const [phrase,       setPhrase]       = useState([]);
  const [search,       setSearch]       = useState('');
  const [searchRes,    setSearchRes]    = useState([]);
  const [searching,    setSearching]    = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [resolvedCats, setResolvedCats] = useState(loadCache());
  const [resolving,    setResolving]    = useState(false);
  const searchTimer = useRef(null);
  const gridShownAt = useRef(Date.now());
  const responseSent = useRef(false);
  const { speak, stop } = useTTS();

  // Resolver una categoría (keyword → {id, l}) si aún no está cacheada.
  const resolveCategory = useCallback(async (cat) => {
    if (resolvedCats[cat.id]) return;
    setResolving(true);
    const out = [];
    // Pequeño paralelismo: lotes de 4 para no abrumar al servidor.
    const batches = [];
    for (let i = 0; i < cat.keywords.length; i += 4) batches.push(cat.keywords.slice(i, i + 4));
    for (const batch of batches) {
      const results = await Promise.all(batch.map(async (kw) => {
        try {
          const r = await fetch(`/api/arasaac/search?q=${encodeURIComponent(kw)}`);
          if (!r.ok) return null;
          const data = await r.json();
          if (!data?.length) return null;
          return { id: data[0].id, l: kw, category: cat.id };
        } catch { return null; }
      }));
      results.forEach(r => r && out.push(r));
    }
    const nextCache = { ...resolvedCats, [cat.id]: out };
    setResolvedCats(nextCache);
    saveCache(nextCache);
    setResolving(false);
  }, [resolvedCats]);

  // Resolver categoría activa al montar y cuando cambia.
  useEffect(() => {
    resolveCategory(activeCat);
    gridShownAt.current = Date.now();
    responseSent.current = false;
  }, [activeCat, resolveCategory]);

  // Búsqueda libre vía backend ARASAAC
  async function doSearch(q) {
    if (!q.trim()) { setSearchRes([]); setSearching(false); return; }
    setSearching(true);
    try {
      const r = await fetch(`/api/arasaac/search?q=${encodeURIComponent(q)}`);
      const data = r.ok ? await r.json() : [];
      setSearchRes(data.slice(0, 24).map(p => ({
        id: p.id,
        l: p.label || q,
        category: 'busqueda',
      })));
    } catch { setSearchRes([]); }
    setSearching(false);
  }

  function handleSearch(e) {
    const v = e.target.value;
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(v), 450);
  }
  function clearSearch() { setSearch(''); setSearchRes([]); }

  // Frase
  function addToPh(picto) {
    if (phrase.length >= 8) return;
    setPhrase(p => [...p, picto]);
    // Tracking de tiempo de respuesta — solo el primer picto desde que se mostró el grid
    if (!responseSent.current) {
      responseSent.current = true;
      const ms = Date.now() - gridShownAt.current;
      api.post('/users/event', { event_type: 'picto_response_ms', details: { ms, category: picto.category || activeCat.id } }).catch(() => {});
    }
  }
  function removeFromPh(i) {
    setPhrase(p => p.filter((_, idx) => idx !== i));
    api.post('/users/event', { event_type: 'picto_removed', details: { phraseLen: phrase.length } }).catch(() => {});
  }
  function clearPh() {
    if (phrase.length > 0) {
      api.post('/users/event', { event_type: 'phrase_cleared', details: { phraseLen: phrase.length } }).catch(() => {});
    }
    setPhrase([]);
    stop();
    setPlaying(false);
  }

  async function playPhrase() {
    if (!phrase.length) return;
    const text = phrase.map(p => p.l).join(' ');
    setPlaying(true);
    speak(text, () => setPlaying(false));

    try {
      const { progress } = await api.post('/phrases', {
        pictogramIds: phrase.map(p => ({ id: p.id, label: p.l, category: p.category || activeCat.id })),
        phraseText: text,
      });
      if (progress) onProgress?.(progress);
    } catch {}
  }

  const displayPictos = search ? searchRes : (resolvedCats[activeCat.id] || []);
  const accentColor   = search ? '#534AB7' : activeCat.color;
  const showLoading   = !search && resolving && !displayPictos.length;

  return (
    <div style={s.wrap}>

      {/* ── BARRA DE FRASE ── */}
      <div style={s.phraseSection}>
        <div style={{
          ...s.phraseBar,
          borderColor: phrase.length > 0 ? accentColor : '#E0DDD5',
        }}>
          {phrase.length === 0 ? (
            <p style={s.hint}>Toca un pictograma para empezar tu frase…</p>
          ) : (
            phrase.map((p, i) => (
              <button key={i} style={{ ...s.chip, borderColor: accentColor, background: activeCat.bg || '#E1F5EE' }}
                onClick={() => removeFromPh(i)}>
                <img src={pictoUrl(p.id)} alt={p.l} style={s.chipImg}
                  onError={e => { e.target.style.opacity = '.3'; }} />
                <span style={{ ...s.chipLabel, color: accentColor }}>{p.l}</span>
                <span style={s.chipX}>✕</span>
              </button>
            ))
          )}
        </div>

        <div style={s.actionRow}>
          <button
            style={{
              ...s.playBtn,
              background: phrase.length ? '#1D9E75' : '#C8C5BC',
              cursor: phrase.length ? 'pointer' : 'not-allowed',
            }}
            onClick={playPhrase}
            disabled={!phrase.length || playing}
          >
            {playing ? '🔊  Reproduciendo…' : '▶  Escuchar mi frase'}
          </button>
          {phrase.length > 0 && (
            <button style={s.clearBtn} onClick={clearPh} title="Borrar frase">🗑️</button>
          )}
        </div>
      </div>

      {/* ── BUSCADOR ── */}
      <div style={s.searchWrap}>
        <input
          type="text"
          placeholder="🔍  Buscar pictograma en ARASAAC…"
          value={search}
          onChange={handleSearch}
          style={s.searchInput}
        />
        {search && (
          <button style={s.searchClear} onClick={clearSearch}>✕</button>
        )}
      </div>

      {/* ── CATEGORÍAS ── */}
      {!search && (
        <div style={s.catWrap}>
          <div style={s.catStrip}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                style={{
                  ...s.catBtn,
                  background: activeCat.id === cat.id ? cat.bg : '#FFFBF4',
                  border: `2px solid ${activeCat.id === cat.id ? cat.color : '#E0DDD5'}`,
                  color: activeCat.id === cat.id ? cat.color : '#6B6960',
                }}
                onClick={() => setActiveCat(cat)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── GRID DE PICTOGRAMAS ── */}
      <div style={s.gridWrap}>
        {searching || showLoading ? (
          <div style={s.loadingMsg}>Cargando pictogramas…</div>
        ) : displayPictos.length === 0 && search ? (
          <div style={s.loadingMsg}>Sin resultados para "{search}"</div>
        ) : displayPictos.length === 0 ? (
          <div style={s.loadingMsg}>Sin pictogramas en esta categoría todavía</div>
        ) : (
          <div style={s.grid}>
            {displayPictos.map((picto, i) => (
              <button
                key={`${picto.id}-${i}`}
                style={s.card}
                onClick={() => addToPh(picto)}
              >
                <img
                  src={pictoUrl(picto.id)}
                  alt={picto.l}
                  style={s.pictoImg}
                  loading="lazy"
                  onError={e => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.fontSize = '14px'; }}
                />
                <span style={s.cardLabel}>{picto.l}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#FFFBF4' },
  phraseSection: { background: '#fff', padding: '12px 16px', borderBottom: '2px solid #F0ECE4', flexShrink: 0 },
  phraseBar: {
    minHeight: '86px', display: 'flex', flexWrap: 'wrap', gap: '8px',
    alignItems: 'center', padding: '10px 12px', background: '#FAFAF8',
    borderRadius: '18px', border: '2px dashed #E0DDD5', marginBottom: '10px', transition: 'border-color .3s',
  },
  hint: { color: '#C0BDB6', fontSize: '15px', fontWeight: 700, width: '100%', textAlign: 'center' },
  chip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '6px 10px', borderRadius: '14px', border: '2px solid', cursor: 'pointer', position: 'relative',
  },
  chipImg:   { width: '52px', height: '52px', objectFit: 'contain' },
  chipLabel: { fontSize: '11px', fontWeight: 800, maxWidth: '64px', textAlign: 'center', lineHeight: 1.2 },
  chipX: {
    position: 'absolute', top: '-7px', right: '-7px',
    background: '#FF6B5B', color: '#fff', borderRadius: '50%',
    width: '18px', height: '18px', fontSize: '9px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900,
  },
  actionRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  playBtn: {
    flex: 1, padding: '14px', borderRadius: '16px', border: 'none', color: '#fff',
    fontSize: '17px', fontWeight: 900, cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 4px 16px rgba(29,158,117,.25)',
  },
  clearBtn: {
    width: '52px', height: '52px', borderRadius: '14px',
    background: '#FFEDED', border: '2px solid #FF6B5B',
    fontSize: '22px', cursor: 'pointer', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  searchWrap: {
    position: 'relative', padding: '10px 16px 6px',
    background: '#fff', borderBottom: '1px solid #F0ECE4', flexShrink: 0,
  },
  searchInput: {
    width: '100%', padding: '10px 40px 10px 16px',
    borderRadius: '14px', border: '2px solid #E0DDD5',
    fontSize: '15px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    outline: 'none', background: '#FAFAF8', color: '#1A1916', boxSizing: 'border-box',
  },
  searchClear: {
    position: 'absolute', right: '26px', top: '50%', transform: 'translateY(-50%)',
    background: '#E0DDD5', border: 'none', borderRadius: '50%',
    width: '22px', height: '22px', fontSize: '11px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
  },
  catWrap: { background: '#fff', borderBottom: '2px solid #F0ECE4', flexShrink: 0 },
  catStrip: { display: 'flex', gap: '6px', padding: '8px 16px', overflowX: 'auto', scrollbarWidth: 'none' },
  catBtn: {
    padding: '8px 16px', borderRadius: '20px', border: '2px solid',
    fontFamily: "'Nunito', sans-serif", fontSize: '13px', fontWeight: 800,
    whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
  },
  gridWrap: { flex: 1, overflowY: 'auto', padding: '12px 16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
    padding: '16px 8px', borderRadius: '20px', background: '#fff', border: '2px solid #F0ECE4',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.06)', fontFamily: "'Nunito', sans-serif",
    minHeight: '140px', justifyContent: 'center',
  },
  pictoImg:  { width: '90px', height: '90px', objectFit: 'contain' },
  cardLabel: { fontSize: '13px', fontWeight: 800, color: '#1A1916', textAlign: 'center', lineHeight: 1.3, maxWidth: '110px' },
  loadingMsg: { padding: '40px', textAlign: 'center', color: '#8A8780', fontSize: '16px', fontWeight: 700 },
};
