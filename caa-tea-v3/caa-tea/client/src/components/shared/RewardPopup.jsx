import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function RewardPopup({ monster, title, sub, starCount = 3, onClose }) {
  const cardRef  = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    spawnConfetti();
    return () => clearTimeout(t);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 250);
  }

  function spawnConfetti() {
    setTimeout(() => {
      const card = cardRef.current;
      if (!card) return;
      const colors = ['#F5A623','#1D9E75','#FF6B5B','#7C5CFC','#4A90E2'];
      for (let i = 0; i < 24; i++) {
        const c = document.createElement('div');
        Object.assign(c.style, {
          position: 'absolute',
          width:  (6 + Math.random() * 8) + 'px',
          height: (6 + Math.random() * 8) + 'px',
          left:  `${5  + Math.random() * 90}%`,
          top:   `${-5 + Math.random() * 15}%`,
          background: colors[i % colors.length],
          borderRadius: Math.random() > .5 ? '50%' : '2px',
          pointerEvents: 'none',
          zIndex: 10,
          animation: `confettiFall ${1.4 + Math.random() * .8}s ease-in ${Math.random() * .4}s forwards`,
          transform: `rotate(${Math.random() * 360}deg)`,
        });
        card.appendChild(c);
        setTimeout(() => c.remove(), 3000);
      }
    }, 120);
  }

  const popup = (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.58)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999,
        opacity: visible ? 1 : 0,
        transition: 'opacity .25s ease',
      }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        ref={cardRef}
        style={{
          background: '#fff', borderRadius: '32px',
          padding: '36px 28px', textAlign: 'center',
          maxWidth: '360px', width: '90%',
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,.3)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px',
          transform: visible ? 'scale(1) translateY(0)' : 'scale(.7) translateY(40px)',
          transition: 'transform .4s cubic-bezier(.34,1.56,.64,1)',
          fontFamily: "'Nunito', sans-serif",
        }}
      >
        {/* Monster en círculo */}
        <div style={{
          width: '110px', height: '110px',
          background: '#FEF3D0', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '4px solid #F5A623',
        }}>
          <span style={{
            fontSize: '64px', lineHeight: 1,
            display: 'block',
            animation: 'bounceY .9s ease-in-out infinite alternate',
          }}>
            {monster}
          </span>
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1A1916', margin: 0 }}>
          {title}
        </h2>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#8A8780', margin: 0 }}>
          {sub}
        </p>

        {/* Estrellas */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {Array(starCount).fill(0).map((_, i) => (
            <span key={i} style={{
              fontSize: '36px', display: 'inline-block',
              animation: 'starPop .4s cubic-bezier(.34,1.56,.64,1) both',
              animationDelay: `${.2 + i * .15}s`,
            }}>⭐</span>
          ))}
        </div>

        <button
          onClick={handleClose}
          style={{
            width: '100%', padding: '16px', borderRadius: '20px',
            background: '#F5A623', border: 'none', color: '#fff',
            fontSize: '20px', fontWeight: 900, cursor: 'pointer',
            fontFamily: "'Nunito', sans-serif",
            boxShadow: '0 6px 20px rgba(245,166,35,.4)',
          }}
        >
          ¡Genial! 🎉
        </button>
      </div>
    </div>
  );

  return createPortal(popup, document.body);
}