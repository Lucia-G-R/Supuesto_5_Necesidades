import React from 'react';

const MONSTERS = [
  { emoji:'🫧', name:'Burbujín',   sub:'Nivel 1',  unlocked:true,  active:true,  unlock:'¡Primera frase!' },
  { emoji:'🔥', name:'Llamita',    sub:'Nivel 2',  unlocked:true,  active:false, unlock:'3 frases en un día' },
  { emoji:'⭐', name:'Estrellux',  sub:'Nivel 2',  unlocked:true,  active:false, unlock:'5 frases en un día' },
  { emoji:'🌈', name:'Arcorín',    sub:'Nivel 5',  unlocked:false, active:false, unlock:'Desbloquea en Nivel 5' },
  { emoji:'🦋', name:'Aletita',    sub:'Racha',    unlocked:false, active:false, unlock:'10 días seguidos' },
  { emoji:'🐲', name:'Dragoncito', sub:'Nivel 8',  unlocked:false, active:false, unlock:'Misterioso…' },
  { emoji:'🍄', name:'Fungito',    sub:'Nivel 6',  unlocked:false, active:false, unlock:'50 frases en total' },
  { emoji:'🦄', name:'Unicornio',  sub:'Especial', unlocked:false, active:false, unlock:'Secreto especial' },
  { emoji:'🐙', name:'Pulgito',    sub:'Nivel 9',  unlocked:false, active:false, unlock:'Nivel 9' },
];

const DAYS = ['Lun','Mar','Mié','Jue','Hoy','Sáb','Dom'];
const DONE_DAYS = [0,1,2,3,4];

export default function Achievements({ stars }) {
  const xpPct = Math.min((stars / 200) * 100, 100);

  return (
    <div style={s.wrap}>
      {/* Level card */}
      <div style={s.levelCard}>
        <div style={s.levelBadge}>
          <span style={s.lvlNum}>4</span>
          <span style={s.lvlTxt}>NIVEL</span>
        </div>
        <div style={s.xpSection}>
          <div style={s.xpLabel}>Progreso al Nivel 5 · {stars} / 200 ⭐</div>
          <div style={s.xpBar}>
            <div style={{ ...s.xpFill, width: `${xpPct}%` }} />
          </div>
          <div style={s.xpHint}>{Math.max(0, 200 - stars)} estrellas para el siguiente nivel</div>
        </div>
      </div>

      {/* Streak */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🔥 Racha semanal</div>
        <div style={s.streakCard}>
          <div style={s.streakRow}>
            {DAYS.map((d, i) => (
              <div key={i} style={s.dayItem}>
                <div style={{
                  ...s.dayCircle,
                  ...(i === 4 ? s.dayToday : DONE_DAYS.includes(i) ? s.dayDone : {}),
                }}>
                  {i === 4 ? '★' : DONE_DAYS.includes(i) ? '✓' : '—'}
                </div>
                <span style={s.dayLbl}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monsters */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🐾 Mis amigos coleccionables</div>
        <div style={s.sectionSub}>Úsala cada día para desbloquearlos todos</div>
        <div style={s.monstersGrid}>
          {MONSTERS.map((m, i) => (
            <div key={i} style={{
              ...s.monsterCard,
              ...(m.active ? s.monsterActive : m.unlocked ? s.monsterUnlocked : s.monsterLocked),
            }}>
              {m.active && <div style={s.activeBadge}>Activo</div>}
              {!m.unlocked && <span style={s.lockIcon}>🔒</span>}
              <span style={{ fontSize:'52px', lineHeight:1, filter: m.unlocked ? 'none' : 'grayscale(0.9)' }}>
                {m.emoji}
              </span>
              <span style={s.monsterName}>{m.name}</span>
              <span style={s.monsterSub}>{m.unlocked ? m.sub + ' · Desbloqueado' : m.unlock}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'20px' },
  levelCard: {
    background:'#fff', borderRadius:'24px', padding:'20px',
    border:'2px solid #F0ECE4', display:'flex', alignItems:'center', gap:'20px',
  },
  levelBadge: {
    width:'80px', height:'80px', borderRadius:'50%', flexShrink:0,
    background:'linear-gradient(135deg,#F5A623,#FF8C00)',
    display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 18px rgba(245,166,35,.4)',
  },
  lvlNum: { fontSize:'30px', fontWeight:900, color:'#fff', lineHeight:1 },
  lvlTxt: { fontSize:'10px', fontWeight:800, color:'rgba(255,255,255,.85)' },
  xpSection: { flex:1 },
  xpLabel:   { fontSize:'13px', fontWeight:700, color:'#8A8780', marginBottom:'8px' },
  xpBar:     { height:'16px', background:'#F0ECE4', borderRadius:'99px', overflow:'hidden' },
  xpFill:    { height:'100%', borderRadius:'99px', background:'linear-gradient(90deg,#F5A623,#FF8C00)', transition:'width .6s ease' },
  xpHint:    { fontSize:'12px', fontWeight:700, color:'#8A8780', marginTop:'6px', textAlign:'right' },
  section: { display:'flex', flexDirection:'column', gap:'10px' },
  sectionTitle: { fontSize:'19px', fontWeight:900, color:'#1A1916' },
  sectionSub:   { fontSize:'13px', fontWeight:700, color:'#8A8780', marginTop:'-6px' },
  streakCard: { background:'#fff', borderRadius:'20px', padding:'16px 20px', border:'2px solid #F0ECE4' },
  streakRow:  { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'8px' },
  dayItem:    { display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' },
  dayCircle: {
    width:'38px', height:'38px', borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'14px', fontWeight:900, border:'2px solid #E0DDD5',
    color:'#C0BDB6', background:'#fff',
  },
  dayDone:  { background:'#1D9E75', border:'2px solid #1D9E75', color:'#fff' },
  dayToday: { background:'#F5A623', border:'2px solid #F5A623', color:'#fff', boxShadow:'0 0 0 4px rgba(245,166,35,.25)' },
  dayLbl:   { fontSize:'10px', fontWeight:700, color:'#8A8780' },
  monstersGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' },
  monsterCard: {
    background:'#fff', borderRadius:'22px', border:'2px solid transparent',
    padding:'16px 8px', display:'flex', flexDirection:'column',
    alignItems:'center', gap:'6px', cursor:'pointer',
    transition:'all .2s', position:'relative', overflow:'hidden',
  },
  monsterUnlocked: { borderColor:'#1D9E75' },
  monsterActive:   { borderColor:'#F5A623', boxShadow:'0 0 0 4px rgba(245,166,35,.2)' },
  monsterLocked:   { opacity:.6 },
  activeBadge: {
    position:'absolute', top:'8px', right:'8px',
    background:'#F5A623', color:'#fff', fontSize:'9px',
    fontWeight:900, borderRadius:'8px', padding:'2px 7px',
  },
  lockIcon: { position:'absolute', top:'8px', right:'8px', fontSize:'16px' },
  monsterName: { fontSize:'14px', fontWeight:900, color:'#1A1916' },
  monsterSub:  { fontSize:'10px', fontWeight:700, color:'#8A8780', textAlign:'center' },
};
