import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api.js';

const DAYS = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

export default function Achievements({ progress }) {
  const [rules, setRules] = useState(null);

  useEffect(() => {
    api.get('/progress/rules').then(setRules).catch(() => {});
  }, []);

  const stars = progress?.total_stars ?? 0;
  const level = progress?.level ?? 1;
  const streak = progress?.streak_days ?? 0;
  const next = progress?.next_threshold;

  // Threshold del nivel actual y siguiente para barra
  const levels = rules?.levels || [];
  const currentLevelInfo = levels.find(l => l.level === level);
  const nextLevelInfo    = levels.find(l => l.level === level + 1);
  const currentThreshold = currentLevelInfo?.threshold ?? 0;
  const nextThreshold    = nextLevelInfo?.threshold ?? next ?? null;

  const progressInLevel = nextThreshold != null
    ? ((stars - currentThreshold) / (nextThreshold - currentThreshold)) * 100
    : 100;
  const xpPct = Math.min(100, Math.max(0, progressInLevel));

  // Día actual: lunes=0 ... domingo=6 (formato europeo)
  const today = new Date();
  const todayIdx = (today.getDay() + 6) % 7;

  return (
    <div style={s.wrap}>
      {/* Tarjeta de nivel */}
      <div style={s.levelCard}>
        <div style={s.levelBadge}>
          <span style={s.lvlNum}>{level}</span>
          <span style={s.lvlTxt}>NIVEL</span>
        </div>
        <div style={s.xpSection}>
          <div style={s.xpLabel}>
            {nextThreshold != null
              ? `Progreso al Nivel ${level + 1} · ${stars} / ${nextThreshold} ⭐`
              : `¡Nivel máximo! ${stars} ⭐`}
          </div>
          <div style={s.xpBar}>
            <div style={{ ...s.xpFill, width: `${xpPct}%` }} />
          </div>
          <div style={s.xpHint}>
            {nextThreshold != null
              ? `${Math.max(0, nextThreshold - stars)} estrellas para el siguiente nivel`
              : 'Has llegado al final de la aventura'}
          </div>
        </div>
      </div>

      {/* Cómo ganar estrellas */}
      <div style={s.section}>
        <div style={s.sectionTitle}>✨ Cómo ganar estrellas</div>
        <div style={s.rulesCard}>
          {(rules?.starRules || []).map(r => (
            <div key={r.action} style={s.ruleRow}>
              <span style={s.ruleLabel}>{r.label}</span>
              <span style={s.ruleStars}>+{r.stars} ⭐</span>
            </div>
          ))}
        </div>
      </div>

      {/* Racha */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🔥 Racha · {streak} {streak === 1 ? 'día' : 'días'}</div>
        <div style={s.streakCard}>
          <div style={s.streakRow}>
            {DAYS.map((d, i) => {
              const distance = todayIdx - i;
              const isToday = i === todayIdx;
              const isDone  = distance > 0 && distance < streak;
              return (
                <div key={i} style={s.dayItem}>
                  <div style={{
                    ...s.dayCircle,
                    ...(isToday ? s.dayToday : isDone ? s.dayDone : {}),
                  }}>
                    {isToday ? '★' : isDone ? '✓' : '—'}
                  </div>
                  <span style={s.dayLbl}>{d}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recompensas por nivel */}
      <div style={s.section}>
        <div style={s.sectionTitle}>🐾 Tus amigos coleccionables</div>
        <div style={s.sectionSub}>Sube de nivel para desbloquearlos</div>
        <div style={s.monstersGrid}>
          {(rules?.levels || []).map(lvl => {
            const unlocked = level >= lvl.level;
            const active   = level === lvl.level;
            return (
              <div key={lvl.level} style={{
                ...s.monsterCard,
                ...(active ? s.monsterActive : unlocked ? s.monsterUnlocked : s.monsterLocked),
              }}>
                {active && <div style={s.activeBadge}>Activo</div>}
                {!unlocked && <span style={s.lockIcon}>🔒</span>}
                <span style={{ fontSize:'52px', lineHeight:1, filter: unlocked ? 'none' : 'grayscale(0.9)' }}>
                  {lvl.reward?.emoji || '⭐'}
                </span>
                <span style={s.monsterName}>{lvl.reward?.name || `Nivel ${lvl.level}`}</span>
                <span style={s.monsterSub}>
                  {unlocked ? `Nivel ${lvl.level} · Desbloqueado` : `${lvl.threshold} ⭐`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s = {
  wrap: { flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'20px' },
  levelCard: { background:'#fff', borderRadius:'24px', padding:'20px', border:'2px solid #F0ECE4', display:'flex', alignItems:'center', gap:'20px' },
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
  section:   { display:'flex', flexDirection:'column', gap:'10px' },
  sectionTitle: { fontSize:'19px', fontWeight:900, color:'#1A1916' },
  sectionSub:   { fontSize:'13px', fontWeight:700, color:'#8A8780', marginTop:'-6px' },
  rulesCard:    { background:'#fff', borderRadius:'20px', padding:'8px 0', border:'2px solid #F0ECE4' },
  ruleRow:      { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:'1px solid #F8F7F4' },
  ruleLabel:    { fontSize:'14px', fontWeight:700, color:'#1A1916' },
  ruleStars:    { fontSize:'14px', fontWeight:900, color:'#F5A623' },
  streakCard: { background:'#fff', borderRadius:'20px', padding:'16px 20px', border:'2px solid #F0ECE4' },
  streakRow:  { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'8px' },
  dayItem:    { display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' },
  dayCircle: { width:'38px', height:'38px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, border:'2px solid #E0DDD5', color:'#C0BDB6', background:'#fff' },
  dayDone:  { background:'#1D9E75', border:'2px solid #1D9E75', color:'#fff' },
  dayToday: { background:'#F5A623', border:'2px solid #F5A623', color:'#fff', boxShadow:'0 0 0 4px rgba(245,166,35,.25)' },
  dayLbl:   { fontSize:'10px', fontWeight:700, color:'#8A8780' },
  monstersGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' },
  monsterCard: {
    background:'#fff', borderRadius:'22px', border:'2px solid transparent',
    padding:'16px 8px', display:'flex', flexDirection:'column',
    alignItems:'center', gap:'6px', cursor:'pointer',
    position:'relative', overflow:'hidden',
  },
  monsterUnlocked: { borderColor:'#1D9E75' },
  monsterActive:   { borderColor:'#F5A623', boxShadow:'0 0 0 4px rgba(245,166,35,.2)' },
  monsterLocked:   { opacity:.6 },
  activeBadge: { position:'absolute', top:'8px', right:'8px', background:'#F5A623', color:'#fff', fontSize:'9px', fontWeight:900, borderRadius:'8px', padding:'2px 7px' },
  lockIcon: { position:'absolute', top:'8px', right:'8px', fontSize:'16px' },
  monsterName: { fontSize:'14px', fontWeight:900, color:'#1A1916' },
  monsterSub:  { fontSize:'10px', fontWeight:700, color:'#8A8780', textAlign:'center' },
};
