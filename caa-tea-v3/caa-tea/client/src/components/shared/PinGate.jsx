import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store.js';
import { api } from '../../utils/api.js';

export default function PinGate() {
  const [adults,   setAdults]   = useState([]);
  const [selected, setSelected] = useState(null);
  const [pin,      setPin]      = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const setAuth  = useStore(s => s.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/all-adults')
      .then(data => {
        setAdults(data);
        if (data.length > 0) setSelected(data[0].id);
      })
      .catch(() => setError('No se pudo cargar la lista de adultos'));
  }, []);

  function handleDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) submit(next);
  }

  function handleDelete() { setPin(p => p.slice(0,-1)); setError(''); }

  async function submit(p = pin) {
    if (!selected) { setError('Selecciona un adulto'); return; }
    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/adult-login', { userId: selected, pin: p });
      setAuth(token, user);
      navigate('/adult/dashboard');
    } catch {
      setError('PIN incorrecto. Prueba con 1234');
      setPin('');
    } finally { setLoading(false); }
  }

  const DIGITS = [1,2,3,4,5,6,7,8,9,null,0,'⌫'];

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => navigate('/')}>← Volver</button>
      <div style={s.card}>
        <div style={s.iconWrap}>🔐</div>
        <h2 style={s.title}>Acceso adulto</h2>

        {adults.length > 1 && (
          <select style={s.select} value={selected || ''}
            onChange={e => { setSelected(e.target.value); setPin(''); setError(''); }}>
            {adults.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        {adults.length === 1 && (
          <p style={s.adultName}>👩 {adults[0].name}</p>
        )}

        <p style={s.sub}>Introduce tu PIN de 4 dígitos</p>
        <div style={s.dots}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              ...s.dot,
              background: i < pin.length ? '#1D9E75' : '#E2E0D8',
              transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
            }} />
          ))}
        </div>

        {error && <p style={s.error}>{error}</p>}

        <div style={s.numpad}>
          {DIGITS.map((d, i) => (
            <button key={i}
              style={{ ...s.digit, opacity: d===null?0:1, pointerEvents: d===null?'none':'auto', background: loading?'#F0ECE4':'#F8F7F4' }}
              disabled={d===null||loading}
              onClick={() => d==='⌫' ? handleDelete() : handleDigit(String(d))}>
              {d}
            </button>
          ))}
        </div>
        {loading && <p style={s.loadingMsg}>Verificando…</p>}
      </div>
      <p style={s.hint}>PIN demo: <strong>1234</strong></p>
    </div>
  );
}

const s = {
  page: { minHeight:'100vh', background:'linear-gradient(160deg,#EEE8FF 0%,#FFFBF4 60%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito',sans-serif", padding:'24px', gap:'16px', position:'relative' },
  back: { position:'absolute', top:'20px', left:'20px', background:'none', border:'none', color:'#8A8780', fontSize:'16px', fontWeight:800, cursor:'pointer', fontFamily:"'Nunito',sans-serif" },
  card: { background:'#fff', borderRadius:'28px', boxShadow:'0 8px 32px rgba(0,0,0,.12)', padding:'36px 28px', display:'flex', flexDirection:'column', alignItems:'center', gap:'16px', width:'100%', maxWidth:'340px' },
  iconWrap: { fontSize:'52px', lineHeight:1 },
  title: { fontSize:'26px', fontWeight:900, color:'#1A1916', margin:0 },
  adultName: { fontSize:'16px', fontWeight:700, color:'#534AB7', margin:0 },
  sub: { fontSize:'14px', color:'#8A8780', fontWeight:700, margin:0 },
  select: { width:'100%', padding:'10px 14px', borderRadius:'14px', border:'2px solid #E0DDD5', fontSize:'15px', fontWeight:700, background:'#F8F7F4', cursor:'pointer', fontFamily:"'Nunito',sans-serif", outline:'none' },
  dots: { display:'flex', gap:'14px' },
  dot: { width:'18px', height:'18px', borderRadius:'50%', transition:'all .15s ease' },
  error: { color:'#FF6B5B', fontWeight:800, fontSize:'14px', margin:0, textAlign:'center' },
  numpad: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', width:'100%' },
  digit: { height:'60px', borderRadius:'16px', border:'2px solid #E0DDD5', fontSize:'24px', fontWeight:900, color:'#1A1916', cursor:'pointer', transition:'all .1s ease', fontFamily:"'Nunito',sans-serif" },
  loadingMsg: { color:'#8A8780', fontSize:'14px', fontWeight:700, margin:0 },
  hint: { color:'#B0ADA4', fontSize:'14px', fontWeight:600 },
};