import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../utils/api.js';

// Mismas categorías built-in que conoce el niño en PhraseBuilder.
const BUILTIN_CATEGORIES = [
  { id: 'comida',   label: 'Comida',   color: '#E8A020', bg: '#FEF3D0' },
  { id: 'acciones', label: 'Acciones', color: '#1D9E75', bg: '#C8F0E1' },
  { id: 'sentir',   label: 'Sentir',   color: '#D85A30', bg: '#FFEDED' },
  { id: 'lugares',  label: 'Lugares',  color: '#4A90E2', bg: '#E3F0FF' },
  { id: 'familia',  label: 'Familia',  color: '#7C5CFC', bg: '#EEE8FF' },
  { id: 'objetos',  label: 'Objetos',  color: '#D4920E', bg: '#FEF3D0' },
  { id: 'higiene',  label: 'Higiene',  color: '#2E7DC4', bg: '#E3F0FF' },
  { id: 'tiempo',   label: 'Tiempo',   color: '#5A3FC0', bg: '#EEE8FF' },
  { id: 'pedir',    label: 'Pedir',    color: '#A844A0', bg: '#FBEAF0' },
];

const COLOR_PRESETS = [
  { color: '#534AB7', bg: '#EEE8FF' },
  { color: '#1D9E75', bg: '#C8F0E1' },
  { color: '#E8A020', bg: '#FEF3D0' },
  { color: '#D85A30', bg: '#FFEDED' },
  { color: '#4A90E2', bg: '#E3F0FF' },
  { color: '#A844A0', bg: '#FBEAF0' },
];

export default function VocabularyEditor({ childId }) {
  const [customCategories, setCustomCategories] = useState([]);
  const [pictograms, setPictograms] = useState([]); // {id, categoryId, pictoId, label, imageUrl}
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [searchRes, setSearchRes] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef(null);

  const [activeCategoryId, setActiveCategoryId] = useState(BUILTIN_CATEGORIES[0].id);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPalette, setNewPalette] = useState(COLOR_PRESETS[0]);

  const refresh = useCallback(() => {
    if (!childId) return;
    setLoading(true);
    api.get(`/categories/${childId}`)
      .then(data => {
        setCustomCategories(data.customCategories || []);
        setPictograms(data.pictograms || []);
      })
      .catch(() => { setCustomCategories([]); setPictograms([]); })
      .finally(() => setLoading(false));
  }, [childId]);

  useEffect(() => { refresh(); }, [refresh]);

  async function doSearch(q) {
    if (!q.trim()) { setSearchRes([]); setSearching(false); return; }
    setSearching(true);
    try {
      const data = await api.get(`/arasaac/search?q=${encodeURIComponent(q)}&lang=es`);
      setSearchRes((data || []).slice(0, 24));
    } catch { setSearchRes([]); }
    setSearching(false);
  }

  function handleSearchChange(e) {
    const v = e.target.value;
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(v), 400);
  }

  async function addPictoToCategory(picto, categoryId) {
    try {
      const created = await api.post(`/categories/${categoryId}/pictograms`, {
        childId,
        pictoId: picto.id,
        label:   picto.label,
        imageUrl: picto.imageUrl,
      });
      setPictograms(prev => [...prev, created]);
    } catch (e) {
      alert(e.message);
    }
  }

  async function removeEntry(entry) {
    if (!confirm(`¿Quitar "${entry.label}" de esta sección?`)) return;
    try {
      await api.delete(`/categories/pictograms/${entry.id}`);
      setPictograms(prev => prev.filter(p => p.id !== entry.id));
    } catch (e) {
      alert(e.message);
    }
  }

  async function createCategory() {
    const label = newName.trim();
    if (!label) return;
    try {
      const created = await api.post('/categories', {
        childId,
        label,
        color: newPalette.color,
        bg:    newPalette.bg,
      });
      setCustomCategories(prev => [...prev, created]);
      setActiveCategoryId(created.id);
      setNewName('');
      setNewPalette(COLOR_PRESETS[0]);
      setCreatingNew(false);
    } catch (e) {
      alert(e.message);
    }
  }

  async function deleteCustomCategory(cat) {
    if (!confirm(`¿Borrar la sección "${cat.label}" y sus pictogramas?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      setCustomCategories(prev => prev.filter(c => c.id !== cat.id));
      setPictograms(prev => prev.filter(p => p.categoryId !== cat.id));
      if (activeCategoryId === cat.id) setActiveCategoryId(BUILTIN_CATEGORIES[0].id);
    } catch (e) {
      alert(e.message);
    }
  }

  const allCategories = [
    ...BUILTIN_CATEGORIES.map(c => ({ ...c, builtin: true })),
    ...customCategories.map(c => ({ ...c, builtin: false })),
  ];

  const activeCategory = allCategories.find(c => c.id === activeCategoryId) || allCategories[0];
  const pictosInActive = pictograms.filter(p => p.categoryId === activeCategoryId);

  return (
    <div style={s.wrap}>
      <h2 style={s.title}>Vocabulario del niño</h2>
      <p style={s.sub}>
        Busca cualquier pictograma en ARASAAC y añádelo a una sección. También
        puedes crear secciones nuevas con su propio color.
      </p>

      {/* ── Selector de sección ── */}
      <div style={s.catStrip}>
        {allCategories.map(cat => (
          <button
            key={cat.id}
            style={{
              ...s.catBtn,
              background: activeCategoryId === cat.id ? cat.bg : '#FFFBF4',
              border: `2px solid ${activeCategoryId === cat.id ? cat.color : '#E0DDD5'}`,
              color: activeCategoryId === cat.id ? cat.color : '#6B6960',
            }}
            onClick={() => setActiveCategoryId(cat.id)}
            title={cat.builtin ? 'Sección base' : 'Sección personalizada'}
          >
            {cat.label}{!cat.builtin && ' ✎'}
          </button>
        ))}
        <button style={s.newCatBtn} onClick={() => setCreatingNew(v => !v)}>
          {creatingNew ? '✕ Cancelar' : '+ Nueva sección'}
        </button>
      </div>

      {/* ── Crear sección nueva ── */}
      {creatingNew && (
        <div style={s.newCatBox}>
          <input
            type="text"
            placeholder="Nombre de la sección (ej: Mascotas)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={s.newCatInput}
            maxLength={32}
          />
          <div style={s.paletteRow}>
            {COLOR_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setNewPalette(p)}
                style={{
                  ...s.paletteSwatch,
                  background: p.bg,
                  border: `3px solid ${newPalette.color === p.color ? p.color : 'transparent'}`,
                }}
                aria-label={`Color ${i + 1}`}
              >
                <span style={{ ...s.paletteDot, background: p.color }} />
              </button>
            ))}
          </div>
          <button style={s.createBtn} onClick={createCategory} disabled={!newName.trim()}>
            Crear sección
          </button>
        </div>
      )}

      {/* ── Sección activa: cabecera + borrar (si custom) ── */}
      <div style={{ ...s.activeHeader, background: activeCategory?.bg, borderColor: activeCategory?.color }}>
        <span style={{ ...s.activeHeaderTitle, color: activeCategory?.color }}>
          Sección: {activeCategory?.label}
        </span>
        {activeCategory && !activeCategory.builtin && (
          <button style={s.deleteCatBtn} onClick={() => deleteCustomCategory(activeCategory)}>
            🗑️ Borrar sección
          </button>
        )}
      </div>

      {/* ── Pictogramas ya añadidos a la sección activa ── */}
      <div>
        <h3 style={s.sectionTitle}>
          Pictogramas en esta sección
          {pictosInActive.length > 0 && <span style={s.count}> · {pictosInActive.length}</span>}
        </h3>
        {loading ? (
          <p style={s.muted}>Cargando…</p>
        ) : pictosInActive.length === 0 ? (
          <p style={s.muted}>
            {activeCategory?.builtin
              ? 'Esta sección base ya tiene pictogramas por defecto. Añade aquí los extra que quieras.'
              : 'Aún no hay pictogramas. Busca abajo y añádelos.'}
          </p>
        ) : (
          <div style={s.grid}>
            {pictosInActive.map(entry => (
              <div key={entry.id} style={s.entryCard}>
                <button style={s.entryRemove} onClick={() => removeEntry(entry)} title="Quitar">✕</button>
                <img src={entry.imageUrl} alt={entry.label} style={s.entryImg}
                     onError={e => e.target.style.opacity = '.3'} />
                <span style={s.entryLabel}>{entry.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Buscador ARASAAC ── */}
      <div>
        <h3 style={s.sectionTitle}>Buscar pictogramas en ARASAAC</h3>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="🔍  Buscar… (ej: perro, médico, merienda)"
          style={s.searchInput}
        />

        {searching ? (
          <p style={s.muted}>Buscando…</p>
        ) : search.trim() && searchRes.length === 0 ? (
          <p style={s.muted}>Sin resultados para "{search}"</p>
        ) : searchRes.length > 0 ? (
          <div style={s.grid}>
            {searchRes.map(picto => {
              const already = pictograms.some(p => p.categoryId === activeCategoryId && p.pictoId === picto.id);
              return (
                <div key={picto.id} style={s.searchCard}>
                  <img src={picto.imageUrl} alt={picto.label} style={s.entryImg}
                       onError={e => e.target.style.opacity = '.3'} />
                  <span style={s.entryLabel}>{picto.label}</span>
                  <button
                    style={{
                      ...s.addBtn,
                      background: already ? '#E0DDD5' : activeCategory?.color || '#534AB7',
                      cursor: already ? 'not-allowed' : 'pointer',
                    }}
                    disabled={already}
                    onClick={() => addPictoToCategory(picto, activeCategoryId)}
                  >
                    {already ? 'Ya añadido' : `+ a ${activeCategory?.label}`}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={s.muted}>Escribe arriba para buscar cualquier pictograma.</p>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: {
    flex: 1, overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '18px',
    fontFamily: 'Nunito, sans-serif',
  },
  title: { fontSize: '22px', fontWeight: 900, color: '#1A1916' },
  sub:   { fontSize: '14px', color: '#6B6960', fontWeight: 600, marginTop: '-12px', lineHeight: 1.4 },

  catStrip: {
    display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center',
  },
  catBtn: {
    padding: '8px 16px', borderRadius: '20px',
    fontFamily: "'Nunito', sans-serif", fontSize: '13px', fontWeight: 800,
    whiteSpace: 'nowrap', cursor: 'pointer',
  },
  newCatBtn: {
    padding: '8px 14px', borderRadius: '20px',
    border: '2px dashed #B8B5AB', background: 'transparent',
    fontSize: '13px', fontWeight: 800, color: '#6B6960', cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
  },

  newCatBox: {
    background: '#FFFBF4', border: '2px solid #E0DDD5', borderRadius: '16px',
    padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px',
  },
  newCatInput: {
    padding: '10px 14px', borderRadius: '12px', border: '2px solid #E2E0D8',
    fontSize: '14px', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    background: '#fff', outline: 'none', boxSizing: 'border-box',
  },
  paletteRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  paletteSwatch: {
    width: '40px', height: '40px', borderRadius: '12px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  paletteDot: { width: '18px', height: '18px', borderRadius: '50%' },
  createBtn: {
    padding: '10px 18px', borderRadius: '14px', border: 'none',
    background: '#534AB7', color: '#fff', fontSize: '14px', fontWeight: 900,
    cursor: 'pointer', alignSelf: 'flex-start', fontFamily: "'Nunito', sans-serif",
  },

  activeHeader: {
    padding: '12px 16px', borderRadius: '14px',
    border: '2px solid', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: '10px',
  },
  activeHeaderTitle: { fontSize: '15px', fontWeight: 900 },
  deleteCatBtn: {
    padding: '6px 12px', borderRadius: '10px',
    background: '#FFEDED', border: '2px solid #FF6B5B', color: '#D85A30',
    fontSize: '12px', fontWeight: 800, cursor: 'pointer',
    fontFamily: "'Nunito', sans-serif",
  },

  sectionTitle: { fontSize: '15px', fontWeight: 900, color: '#1A1916', marginBottom: '8px' },
  count: { fontSize: '13px', fontWeight: 700, color: '#8A8780' },
  muted: { fontSize: '13px', color: '#8A8780', fontWeight: 600 },

  searchInput: {
    width: '100%', padding: '12px 16px', borderRadius: '14px',
    border: '2px solid #E0DDD5', fontSize: '15px', fontWeight: 700,
    fontFamily: "'Nunito', sans-serif", background: '#FAFAF8',
    color: '#1A1916', outline: 'none', boxSizing: 'border-box',
    marginBottom: '12px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
  },
  entryCard: {
    background: '#fff', borderRadius: '14px',
    border: '2px solid #E0DDD5', padding: '10px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '6px', position: 'relative',
  },
  entryRemove: {
    position: 'absolute', top: '4px', right: '4px',
    background: '#FFEDED', border: '2px solid #FF6B5B', color: '#D85A30',
    width: '24px', height: '24px', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: 900, cursor: 'pointer',
  },
  entryImg:   { width: '70px', height: '70px', objectFit: 'contain' },
  entryLabel: { fontSize: '12px', fontWeight: 800, color: '#1A1916', textAlign: 'center' },

  searchCard: {
    background: '#fff', borderRadius: '14px',
    border: '2px solid #E0DDD5', padding: '10px 8px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
  },
  addBtn: {
    width: '100%', padding: '6px 8px', borderRadius: '10px',
    border: 'none', color: '#fff', fontSize: '11px', fontWeight: 900,
    fontFamily: "'Nunito', sans-serif",
  },
};
