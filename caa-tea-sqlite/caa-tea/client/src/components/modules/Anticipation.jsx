import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

const SLOT_CONFIG = {
  now:   { label: 'AHORA',   color: '#D4920E', bg: '#FEF3D0', emoji: '⭐' },
  next:  { label: 'DESPUÉS', color: '#1D9E75', bg: '#E1F5EE', emoji: '🔜' },
  later: { label: 'LUEGO',   color: '#7B7A73', bg: '#F1EFE8', emoji: '⏳' },
};

export default function Anticipation({ childId, onProgress }) {
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (!childId) return;
    api.get(`/schedule/${childId}/today`)
      .then(setSchedule)
      .catch(() => setSchedule(null))
      .finally(() => setLoading(false));
  }, [childId]);

  async function handleAdvance() {
    try {
      const updated = await api.patch(`/schedule/${childId}/advance`);
      setSchedule(updated);
      if (updated?.progress) onProgress?.(updated.progress);
    } catch (e) {
      alert('Error: ' + e.message);
    }
  }

  const currentNowCompleted = schedule?.slot_now?.completed;

  if (loading) return <div style={s.center}><span style={s.spinner}>⏳</span></div>;

  if (!schedule) return (
    <div style={s.center}>
      <span style={{ fontSize: '64px' }}>📅</span>
      <p style={s.emptyMsg}>No hay agenda para hoy</p>
      <p style={s.emptyHint}>Pídele a mamá o papá que la configure</p>
    </div>
  );

  const slots = [
    { key: 'now',   data: schedule.slot_now   },
    { key: 'next',  data: schedule.slot_next  },
    { key: 'later', data: schedule.slot_later },
  ];

  return (
    <div style={s.wrap}>
      <h2 style={s.heading}>¿Qué hago hoy?</h2>

      <div style={s.slots}>
        {slots.map(({ key, data }) => {
          const cfg = SLOT_CONFIG[key];
          if (!data) return null;
          return (
            <div
              key={key}
              style={{
                ...s.slot,
                background: cfg.bg,
                border: `3px solid ${cfg.color}`,
                opacity: data.completed ? 0.5 : 1,
              }}
            >
              <div style={{ ...s.slotHeader, background: cfg.color }}>
                <span style={s.slotEmoji}>{cfg.emoji}</span>
                <span style={s.slotTitle}>{cfg.label}</span>
              </div>

              <div style={s.slotBody}>
                {data.completed ? (
                  <div style={s.checkWrap}>
                    <span style={s.check}>✅</span>
                    <span style={s.doneText}>¡Hecho!</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={data.imageUrl}
                      alt={data.label}
                      style={s.pictoImg}
                      onError={e => e.target.style.display='none'}
                    />
                    <p style={{ ...s.pictoLabel, color: cfg.color }}>{data.label}</p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advance button - only shown for the adult to tick off */}
      {!currentNowCompleted && (
        <button style={s.advanceBtn} onClick={handleAdvance}>
          ✅ Completar "{schedule.slot_now?.label}"
        </button>
      )}
    </div>
  );
}

const s = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '20px 16px', gap: '20px',
    overflowY: 'auto', fontFamily: 'Nunito, sans-serif',
  },
  heading: {
    fontSize: '28px', fontWeight: 900, color: '#1A1916',
    textAlign: 'center',
  },
  slots: {
    display: 'flex', flexDirection: 'column', gap: '16px',
    width: '100%', maxWidth: '460px',
  },
  slot: {
    borderRadius: '24px', overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    transition: 'opacity 0.3s ease',
  },
  slotHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 20px',
  },
  slotEmoji: { fontSize: '22px' },
  slotTitle: { fontSize: '16px', fontWeight: 900, color: '#fff', letterSpacing: '1px' },
  slotBody: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '20px', gap: '12px',
  },
  pictoImg: { width: '110px', height: '110px', objectFit: 'contain' },
  pictoLabel: { fontSize: '22px', fontWeight: 800 },
  checkWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  check: { fontSize: '56px', animation: 'checkmark 0.4s ease both' },
  doneText: { fontSize: '20px', fontWeight: 800, color: '#1D9E75' },
  advanceBtn: {
    padding: '16px 28px', borderRadius: '20px',
    background: '#1D9E75', border: 'none', color: '#fff',
    fontSize: '18px', fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(29,158,117,0.3)',
    maxWidth: '460px', width: '100%',
    transition: 'all 0.2s',
  },
  center: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '16px', padding: '40px',
  },
  spinner: { fontSize: '48px', animation: 'pulse 1.5s infinite' },
  emptyMsg: { fontSize: '22px', fontWeight: 800, color: '#1A1916', textAlign: 'center' },
  emptyHint: { fontSize: '16px', color: '#6B6960', textAlign: 'center', fontWeight: 600 },
};
