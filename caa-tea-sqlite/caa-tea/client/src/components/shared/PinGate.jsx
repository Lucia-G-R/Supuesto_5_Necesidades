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
  const setAuth            = useStore(s => s.setAuth);
  const restoreChildSession= useStore(s => s.restoreChildSession);
  const pendingChildSession= useStore(s => s.pendingChildSession);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/users/all-adults')
      .then(list => {
        setAdults(list);
        if (list[0]) setSelected(list[0].id);
      })
      .catch(() => {
        // Fallback al ID demo determinista
        setAdults([{ id: '00000000-0000-0000-0000-000000000001', name: 'María (mamá)' }]);
        setSelected('00000000-0000-0000-0000-000000000001');
      });
  }, []);

  // Si el niño venía a pedir ayuda, "Volver" lo devuelve a su sesión.
  function handleBack() {
    if (pendingChildSession) {
      restoreChildSession();
      navigate('/child');
    } else {
      navigate('/');
    }
  }

  function handleDigit(d) {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) submit(next);
  }

  function handleDelete() { setPin(p => p.slice(0,-1)); setError(''); }

  async function submit(p = pin) {
    if (!selected) return;
    setLoading(true);
    try {
      const { token, user } = await api.post('/auth/adult-login', { userId: selected, pin: p });
      setAuth(token, user);
      navigate('/adult/dashboard');
    } catch {
      setError('PIN incorrecto');
      setPin('');
    } finally { setLoading(false); }
  }

  const DIGITS = [1,2,3,4,5,6,7,8,9,null,0,'⌫'];

  return (
    <div style={s.page}>
      <button style={s.back} onClick={handleBack}>← Volver</button>

      <div style={s.card}>
        <div style={s.icon}>🔐</div>
        <h2 style={s.title}>Acceso adulto</h2>
        <p style={s.sub}>Introduce tu PIN de 4 dígitos</p>

        {/* Dots */}
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

        {/* Numpad */}
        <div style={s.numpad}>
          {DIGITS.map((d, i) => (
            <button
              key={i}
              style={{ ...s.digit, opacity: d === null ? 0 : 1 }}
              disabled={d === null || loading}
              onClick={() => d === '⌫' ? handleDelete() : handleDigit(String(d))}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
      <p style={s.hint}>Demo: PIN 1234</p>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg,#EEEDFE 0%,#F8F7F4 60%)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Nunito, sans-serif', padding: '24px', gap: '16px',
  },
  back: {
    position: 'absolute', top: '20px', left: '20px',
    background: 'none', border: 'none', color: '#6B6960',
    fontSize: '16px', fontWeight: 700, cursor: 'pointer',
  },
  card: {
    background: '#fff', borderRadius: '28px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    padding: '40px 32px', display: 'flex',
    flexDirection: 'column', alignItems: 'center', gap: '20px',
    width: '100%', maxWidth: '360px',
  },
  icon: { fontSize: '52px' },
  title: { fontSize: '26px', fontWeight: 900, color: '#1A1916' },
  sub: { fontSize: '15px', color: '#6B6960', fontWeight: 600 },
  dots: { display: 'flex', gap: '16px' },
  dot: {
    width: '18px', height: '18px', borderRadius: '50%',
    transition: 'all 0.15s ease',
  },
  error: { color: '#D85A30', fontWeight: 700, fontSize: '15px' },
  numpad: {
    display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
    gap: '12px', width: '100%',
  },
  digit: {
    height: '64px', borderRadius: '16px',
    background: '#F8F7F4', border: '2px solid #E2E0D8',
    fontSize: '24px', fontWeight: 800, color: '#1A1916',
    cursor: 'pointer', transition: 'all 0.1s ease',
    fontFamily: 'Nunito, sans-serif',
  },
  hint: { color: '#9E9C95', fontSize: '13px', fontWeight: 600 },
};
