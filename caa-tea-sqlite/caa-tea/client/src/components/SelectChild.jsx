import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store.js';
import { api } from '../utils/api.js';

const COLORS = ['#1D9E75','#F5A623','#7C5CFC','#FF6B5B','#4A90E2','#D4920E'];
const BG_COLORS = ['#C8F0E1','#FEF3D0','#EEE8FF','#FFEDED','#E3F0FF','#FEF3D0'];

export default function SelectChild() {
  const [children, setChildren] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const setAuth  = useStore(s => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/all-children')
      .then(setChildren)
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleSelectChild(child) {
    try {
      const { token, user } = await api.post('/auth/child-login', { childId: child.id });
      setAuth(token, user);
      navigate('/child');
    } catch (e) { alert('Error: ' + e.message); }
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.logoCircle}>🗣️</div>
        <h1 style={s.title}>¿Quién eres?</h1>
        <p style={s.sub}>Toca tu nombre para empezar</p>
      </div>

      {loading ? (
        <div style={s.grid}>
          {[1,2,3].map(i => <div key={i} style={{ ...s.skeleton, animationDelay: i * .1 + 's' }} />)}
        </div>
      ) : (
        <div style={s.grid}>
          {children.map((child, i) => (
            <button key={child.id} style={{ ...s.card, background: BG_COLORS[i % BG_COLORS.length] }} onClick={() => handleSelectChild(child)}>
              <div style={{ ...s.avatar, background: COLORS[i % COLORS.length] }}>
                {child.name[0].toUpperCase()}
              </div>
              <span style={s.name}>{child.name}</span>
              <div style={{ ...s.playPill, background: COLORS[i % COLORS.length] }}>¡Empezar!</div>
            </button>
          ))}
        </div>
      )}

      <button style={s.adultBtn} onClick={() => navigate('/adult')}>
        👩‍💼 Soy adulto / profesional
      </button>
    </div>
  );
}

const s = {
  page: {
    minHeight:'100vh', background:'linear-gradient(160deg,#FEF3D0 0%,#FFFBF4 50%)',
    display:'flex', flexDirection:'column', alignItems:'center',
    justifyContent:'center', padding:'32px 24px', gap:'36px',
    fontFamily:"'Nunito', sans-serif",
  },
  header: { textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' },
  logoCircle: {
    width:'90px', height:'90px', background:'#F5A623', borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'44px', boxShadow:'0 6px 24px rgba(245,166,35,.4)',
    animation:'bounceY 2s ease-in-out infinite alternate',
  },
  title: { fontSize:'40px', fontWeight:900, color:'#1A1916' },
  sub:   { fontSize:'18px', fontWeight:700, color:'#8A8780' },
  grid:  { display:'flex', flexWrap:'wrap', gap:'20px', justifyContent:'center', maxWidth:'640px' },
  card: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:'14px',
    padding:'28px 24px', borderRadius:'28px', border:'none', cursor:'pointer',
    boxShadow:'0 6px 24px rgba(0,0,0,.1)', transition:'transform .2s, box-shadow .2s',
    minWidth:'160px',
  },
  avatar: {
    width:'96px', height:'96px', borderRadius:'50%',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontSize:'44px', fontWeight:900, color:'#fff',
    boxShadow:'0 4px 14px rgba(0,0,0,.15)',
  },
  name: { fontSize:'22px', fontWeight:900, color:'#1A1916' },
  playPill: {
    padding:'8px 20px', borderRadius:'99px', color:'#fff',
    fontSize:'15px', fontWeight:800,
  },
  skeleton: {
    width:'160px', height:'220px', borderRadius:'28px',
    background:'linear-gradient(90deg,#f0ede8 25%,#faf8f4 50%,#f0ede8 75%)',
    backgroundSize:'200% 100%', animation:'shimmer 1.4s ease-in-out infinite',
  },
  adultBtn: {
    padding:'14px 28px', borderRadius:'99px',
    background:'transparent', border:'2px solid #E0DDD5',
    color:'#8A8780', fontSize:'16px', fontWeight:800, cursor:'pointer',
    transition:'all .2s',
  },
};
