import React, { useState, useCallback } from 'react';
import { useTTS } from '../../hooks/useTTS.js';
import { api } from '../../utils/api.js';

const CATEGORIES = [
  { id: 'comida',   label: 'Comida',    emoji: '🍎', items: [
    {e:'🍎',l:'Manzana'},{e:'🥛',l:'Leche'},{e:'🍞',l:'Pan'},
    {e:'🍌',l:'Plátano'},{e:'🍕',l:'Pizza'},{e:'🥤',l:'Zumo'},
    {e:'🍫',l:'Chocolate'},{e:'🥗',l:'Ensalada'}]},
  { id: 'acciones', label: 'Acciones',  emoji: '🏃', items: [
    {e:'🏃',l:'Correr'},{e:'🛁',l:'Bañarse'},{e:'😴',l:'Dormir'},
    {e:'📚',l:'Leer'},{e:'🎨',l:'Dibujar'},{e:'🎮',l:'Jugar'},
    {e:'✋',l:'Parar'},{e:'🙏',l:'Por favor'}]},
  { id: 'sentir',   label: 'Sentir',    emoji: '😊', items: [
    {e:'😄',l:'Feliz'},{e:'😢',l:'Triste'},{e:'😠',l:'Enfadado'},
    {e:'😨',l:'Asustado'},{e:'😌',l:'Calmado'},{e:'🤢',l:'Mal'},
    {e:'😍',l:'Me gusta'},{e:'👎',l:'No quiero'}]},
  { id: 'lugares',  label: 'Lugares',   emoji: '🏠', items: [
    {e:'🏠',l:'Casa'},{e:'🏫',l:'Colegio'},{e:'🏥',l:'Hospital'},
    {e:'🛒',l:'Tienda'},{e:'🚗',l:'Coche'},{e:'🌳',l:'Parque'},
    {e:'🛁',l:'Baño'},{e:'🛏️',l:'Dormitorio'}]},
  { id: 'personas', label: 'Familia',   emoji: '👨‍👩‍👧', items: [
    {e:'👩',l:'Mamá'},{e:'👨',l:'Papá'},{e:'👧',l:'Yo'},
    {e:'👴',l:'Abuelo'},{e:'👵',l:'Abuela'},{e:'👨‍⚕️',l:'Doctor'},
    {e:'👩‍🏫',l:'Profe'},{e:'🧒',l:'Amigo'}]},
];

const REWARD_MILESTONES = [
  { count: 1,  monster: '🫧', title: '¡Primera frase!',   sub: '¡Qué bien hablas!',              stars: 2 },
  { count: 3,  monster: '🔥', title: '¡Llamita!',         sub: '¡3 frases, eres increíble!',     stars: 3 },
  { count: 5,  monster: '⭐', title: '¡Estrellux!',       sub: '¡5 frases! Brillante como tú.',  stars: 3 },
  { count: 10, monster: '🌈', title: '¡Arcorín apareció!', sub: '¡10 frases! ¡Eres un campeón!', stars: 5 },
];

export default function PhraseBuilder({ childId, addStars, giveReward }) {
  const [activeCat, setActiveCat] = useState(CATEGORIES[0]);
  const [phrase,    setPhrase]    = useState([]);
  const [playing,   setPlaying]   = useState(false);
  const [phraseCount, setPhraseCount] = useState(0);
  const { speak, stop } = useTTS();

  function addToPh(item) {
    if (phrase.length >= 6) return;
    setPhrase(p => [...p, item]);
  }
  function removeFromPh(i) { setPhrase(p => p.filter((_,idx) => idx !== i)); }
  function clearPh() { setPhrase([]); stop(); setPlaying(false); }

  async function playPhrase() {
    if (!phrase.length) return;
    const text = phrase.map(p => p.l).join(' ');
    setPlaying(true);
    speak(text, () => setPlaying(false));
    addStars(5);
    const newCount = phraseCount + 1;
    setPhraseCount(newCount);

    const milestone = REWARD_MILESTONES.find(m => m.count === newCount);
    if (milestone) {
      addStars(milestone.stars * 10);
      setTimeout(() => giveReward(milestone), 600);
    }

    try {
      await api.post('/phrases', {
        pictogramIds: phrase.map(p => ({ id: p.l, label: p.l, imageUrl: '' })),
        phraseText: text,
      });
    } catch {}
  }

  return (
    <div style={s.wrap}>
      {/* Phrase bar */}
      <div style={s.phraseSection}>
        <div style={s.phraseBar}>
          {phrase.length === 0 ? (
            <p style={s.hint}>Toca un pictograma para empezar tu frase…</p>
          ) : (
            phrase.map((p, i) => (
              <button key={i} style={s.chip} onClick={() => removeFromPh(i)}>
                <span style={{ fontSize: '44px', lineHeight: 1 }}>{p.e}</span>
                <span style={s.chipLabel}>{p.l}</span>
                <span style={s.chipX}>✕</span>
              </button>
            ))
          )}
        </div>
        <div style={s.actionRow}>
          <button
            style={{ ...s.playBtn, opacity: !phrase.length ? .5 : 1 }}
            onClick={playPhrase}
            disabled={!phrase.length || playing}
          >
            <span>{playing ? '🔊' : '▶'}</span>
            {playing ? 'Reproduciendo…' : 'Escuchar mi frase'}
          </button>
          {phrase.length > 0 && (
            <button style={s.clearBtn} onClick={clearPh}>🗑️</button>
          )}
        </div>
      </div>

      {/* Category strip */}
      <div style={s.catStrip}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            style={{ ...s.catBtn, ...(activeCat.id === cat.id ? s.catBtnSel : {}) }}
            onClick={() => setActiveCat(cat)}
          >
            <span style={{ fontSize: '22px' }}>{cat.emoji}</span>
            <span style={s.catLabel}>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Picto grid */}
      <div style={s.grid}>
        {activeCat.items.map((item, i) => (
          <button
            key={i}
            style={s.card}
            onClick={() => addToPh(item)}
          >
            <span style={{ fontSize: '62px', lineHeight: 1 }}>{item.e}</span>
            <span style={s.cardLabel}>{item.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const s = {
  wrap: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#FFFBF4' },
  phraseSection: { background:'#fff', padding:'14px 20px', borderBottom:'2px solid #F0ECE4', flexShrink:0 },
  phraseBar: {
    minHeight:'88px', display:'flex', flexWrap:'wrap', gap:'8px',
    alignItems:'center', padding:'10px',
    background:'#FFFBF4', borderRadius:'20px', border:'2px dashed #E0DDD5',
    marginBottom:'10px',
  },
  hint: { color:'#C0BDB6', fontSize:'15px', fontWeight:700, width:'100%', textAlign:'center' },
  chip: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
    padding:'8px 12px', background:'#C8F0E1', border:'2px solid #1D9E75',
    borderRadius:'16px', cursor:'pointer', position:'relative',
    animation:'popIn .2s ease both',
  },
  chipLabel: { fontSize:'12px', fontWeight:800, color:'#1D9E75' },
  chipX: {
    position:'absolute', top:'-7px', right:'-7px',
    background:'#FF6B5B', color:'#fff', borderRadius:'50%',
    width:'20px', height:'20px', fontSize:'10px',
    display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900,
  },
  actionRow: { display:'flex', gap:'10px', alignItems:'center' },
  playBtn: {
    flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'10px',
    padding:'15px', borderRadius:'18px', background:'#1D9E75',
    border:'none', color:'#fff', fontSize:'18px', fontWeight:900, cursor:'pointer',
    boxShadow:'0 4px 18px rgba(29,158,117,.35)', transition:'all .2s',
    fontFamily:"'Nunito', sans-serif",
  },
  clearBtn: {
    width:'54px', height:'54px', borderRadius:'16px',
    background:'#FFEDED', border:'2px solid #FF6B5B',
    fontSize:'24px', cursor:'pointer',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  catStrip: {
    display:'flex', gap:'8px', padding:'12px 20px',
    overflowX:'auto', flexShrink:0, scrollbarWidth:'none',
    background:'#fff', borderBottom:'2px solid #F0ECE4',
  },
  catBtn: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
    padding:'10px 16px', borderRadius:'16px', border:'2px solid #E0DDD5',
    background:'#FFFBF4', whiteSpace:'nowrap', cursor:'pointer', flexShrink:0,
    transition:'all .15s',
  },
  catBtnSel: { border:'2px solid #1D9E75', background:'#C8F0E1' },
  catLabel: { fontSize:'12px', fontWeight:800, color:'#1A1916' },
  grid: {
    flex:1, display:'grid', gridTemplateColumns:'repeat(4,1fr)',
    gap:'12px', padding:'16px 20px', overflowY:'auto', alignContent:'start',
  },
  card: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:'8px',
    padding:'16px 8px', borderRadius:'22px',
    background:'#fff', border:'2px solid #F0ECE4', cursor:'pointer',
    boxShadow:'0 2px 10px rgba(0,0,0,.05)', transition:'all .15s',
    fontFamily:"'Nunito', sans-serif",
  },
  cardLabel: { fontSize:'14px', fontWeight:800, color:'#1A1916', textAlign:'center' },
};
