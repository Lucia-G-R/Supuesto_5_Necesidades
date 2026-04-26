import React, { useEffect, useRef } from 'react';

export default function RewardPopup({ monster, title, sub, starCount = 3, onClose }) {
  const cardRef = useRef(null);

  useEffect(() => {
    spawnConfetti();
  }, []);

  function spawnConfetti() {
    const card = cardRef.current;
    if (!card) return;
    const colors = ['#F5A623','#1D9E75','#FF6B5B','#7C5CFC','#4A90E2'];
    for (let i = 0; i < 22; i++) {
      const c = document.createElement('div');
      Object.assign(c.style, {
        position: 'absolute',
        width: '10px', height: '10px',
        left: `${10 + Math.random() * 80}%`,
        top: `${-5 + Math.random() * 20}%`,
        background: colors[i % colors.length],
        borderRadius: Math.random() > .5 ? '50%' : '2px',
        animationName: 'confettiFall',
        animationDelay: `${Math.random() * .6}s`,
        animationDuration: `${1.5 + Math.random()}s`,
        animationFillMode: 'forwards',
        transform: `rotate(${Math.random() * 360}deg)`,
        pointerEvents: 'none',
      });
      card.appendChild(c);
      setTimeout(() => c.remove(), 3000);
    }
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.card} ref={cardRef}>
        <div style={s.monster}>{monster}</div>
        <div style={s.title}>{title}</div>
        <div style={s.sub}>{sub}</div>
        <div style={s.stars}>
          {Array(starCount).fill(0).map((_, i) => (
            <span key={i} style={{
              fontSize: '36px',
              animation: `starPop .4s ease both`,
              animationDelay: `${i * 0.15}s`,
              display: 'inline-block',
            }}>⭐</span>
          ))}
        </div>
        <button style={s.btn} onClick={onClose}>¡Genial! 🎉</button>
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, animation: 'fadeIn .25s ease',
  },
  card: {
    background: '#FFFFFF', borderRadius: '32px',
    padding: '40px 32px', textAlign: 'center',
    maxWidth: '380px', width: '90%',
    animation: 'popIn .35s cubic-bezier(.34,1.56,.64,1) both',
    position: 'relative', overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,.2)',
  },
  monster: {
    fontSize: '96px', lineHeight: 1,
    animation: 'bounceY 1s ease-in-out infinite alternate',
    display: 'block', marginBottom: '12px',
  },
  title: { fontSize: '30px', fontWeight: 900, color: '#1A1916', marginBottom: '6px' },
  sub:   { fontSize: '16px', fontWeight: 700, color: '#8A8780' },
  stars: { margin: '16px 0', display: 'flex', justifyContent: 'center', gap: '8px' },
  btn: {
    width: '100%', padding: '16px',
    borderRadius: '20px', background: '#F5A623',
    border: 'none', color: '#fff',
    fontSize: '20px', fontWeight: 900,
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    boxShadow: '0 6px 20px rgba(245,166,35,.4)',
    transition: 'transform .15s',
  },
};
