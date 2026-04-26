import React, { useState } from 'react';
import { useTTS } from '../../hooks/useTTS.js';
import { api } from '../../utils/api.js';

const EMOTIONS = [
  { id:'feliz',       l:'Feliz',       e:'😄', bg:'#FEF3D0', border:'#F5A623', color:'#D4920E' },
  { id:'triste',      l:'Triste',      e:'😢', bg:'#E3F0FC', border:'#4A90E2', color:'#2E7DC4' },
  { id:'enfadado',    l:'Enfadado',    e:'😠', bg:'#FFEDED', border:'#FF6B5B', color:'#D85A30' },
  { id:'asustado',    l:'Asustado',    e:'😨', bg:'#EEE8FF', border:'#7C5CFC', color:'#5A3FC0' },
  { id:'calmado',     l:'Calmado',     e:'😌', bg:'#C8F0E1', border:'#1D9E75', color:'#1D9E75' },
  { id:'sorprendido', l:'Sorprendido', e:'😲', bg:'#FFEDED', border:'#FF6B5B', color:'#D85A30' },
];

const STRATEGIES = {
  feliz:       [{e:'🤝',l:'Compartir'},{e:'🎮',l:'Jugar'},{e:'🎵',l:'Cantar'}],
  triste:      [{e:'🤗',l:'Pedir abrazo'},{e:'🎶',l:'Música'},{e:'🛋️',l:'Descansar'}],
  enfadado:    [{e:'🌬️',l:'Respirar'},{e:'🧘',l:'Zona tranquila'},{e:'🔢',l:'Contar hasta 10'}],
  asustado:    [{e:'🌬️',l:'Respirar'},{e:'🙋',l:'Pedir ayuda'},{e:'🤗',l:'Abrazo fuerte'}],
  calmado:     [{e:'📖',l:'Leer'},{e:'🎨',l:'Dibujar'},{e:'🚶',l:'Pasear'}],
  sorprendido: [{e:'🌬️',l:'Respirar'},{e:'❓',l:'Preguntar'},{e:'⏸️',l:'Esperar'}],
};

export default function EmotionRegulator({ childId, onProgress, giveReward }) {
  const [step,    setStep]    = useState('emotion');
  const [emotion, setEmotion] = useState(null);
  const [intensity] = useState(2);
  const { speak } = useTTS();

  function pickEmotion(em) {
    setEmotion(em);
    speak(em.l);
    setStep('strategy');
  }

  async function pickStrategy(strat) {
    speak(strat.l);
    try {
      const { progress } = await api.post('/emotion', {
        emotion: emotion.id, intensity, strategyChosen: strat.l,
      });
      onProgress?.(progress);
    } catch {}
    giveReward({
      monster: '🌟',
      title: '¡Muy bien!',
      sub: `Elegiste "${strat.l}" tú solo. ¡Eso es genial!`,
      starCount: 3,
    });
    setTimeout(() => { setStep('emotion'); setEmotion(null); }, 3200);
  }

  async function skipStrategy() {
    try { await api.post('/emotion', { emotion: emotion?.id, intensity, strategyChosen: null }); } catch {}
    setStep('emotion'); setEmotion(null);
  }

  return (
    <div style={s.wrap}>
      <div style={s.stepper}>
        {['¿Cómo te sientes?', '¿Qué haces?'].map((label, i) => {
          const idx = step === 'emotion' ? 0 : 1;
          return (
            <div key={i} style={s.stepItem}>
              <div style={{ ...s.stepDot, background: i <= idx ? '#1D9E75' : '#E0DDD5', color: i <= idx ? '#fff' : '#C0BDB6' }}>
                {i + 1}
              </div>
              <span style={{ ...s.stepLabel, color: i === idx ? '#1A1916' : '#C0BDB6' }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={s.content}>
        {step === 'emotion' && (
          <>
            <h2 style={s.heading}>¿Cómo te sientes ahora?</h2>
            <div style={s.emotionGrid}>
              {EMOTIONS.map(em => (
                <button
                  key={em.id}
                  style={{ ...s.emCard, background: em.bg, border: `3px solid ${em.border}` }}
                  onClick={() => pickEmotion(em)}
                >
                  <span style={{ fontSize:'56px', lineHeight:1 }}>{em.e}</span>
                  <span style={{ ...s.emLabel, color: em.color }}>{em.l}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 'strategy' && emotion && (
          <>
            <h2 style={s.heading}>
              <span style={{ fontSize:'40px' }}>{emotion.e}</span>{' '}
              ¿Qué puedes hacer?
            </h2>
            <div style={s.stratList}>
              {(STRATEGIES[emotion.id] || []).map((strat, i) => (
                <button
                  key={i}
                  style={{ ...s.stratCard, background: emotion.bg, border: `3px solid ${emotion.border}` }}
                  onClick={() => pickStrategy(strat)}
                >
                  <span style={{ fontSize:'44px', lineHeight:1 }}>{strat.e}</span>
                  <span style={{ ...s.stratLabel, color: emotion.color }}>{strat.l}</span>
                </button>
              ))}
            </div>
            <button style={s.skipBtn} onClick={skipStrategy}>Necesito ayuda de un adulto</button>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  wrap: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  stepper: { display:'flex', justifyContent:'center', gap:'24px', padding:'12px 20px', background:'#fff', borderBottom:'2px solid #F0ECE4', flexShrink:0 },
  stepItem: { display:'flex', alignItems:'center', gap:'8px' },
  stepDot:  { width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:900 },
  stepLabel:{ fontSize:'14px', fontWeight:800 },
  content:  { flex:1, display:'flex', flexDirection:'column', alignItems:'center', padding:'24px 20px', gap:'20px', overflowY:'auto' },
  heading:  { fontSize:'22px', fontWeight:900, color:'#1A1916', textAlign:'center', display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', justifyContent:'center' },
  emotionGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', width:'100%', maxWidth:'480px' },
  emCard: { display:'flex', flexDirection:'column', alignItems:'center', gap:'10px', padding:'20px 10px', borderRadius:'24px', cursor:'pointer', boxShadow:'0 3px 14px rgba(0,0,0,.08)', fontFamily:"'Nunito', sans-serif" },
  emLabel: { fontSize:'16px', fontWeight:900 },
  stratList: { display:'flex', flexDirection:'column', gap:'12px', width:'100%', maxWidth:'420px' },
  stratCard: { display:'flex', alignItems:'center', gap:'16px', padding:'18px 22px', borderRadius:'22px', cursor:'pointer', boxShadow:'0 3px 14px rgba(0,0,0,.08)', fontFamily:"'Nunito', sans-serif" },
  stratLabel: { fontSize:'20px', fontWeight:900 },
  skipBtn: { padding:'12px 24px', borderRadius:'99px', background:'transparent', border:'2px solid #E0DDD5', color:'#8A8780', fontSize:'14px', fontWeight:700, cursor:'pointer' },
};
