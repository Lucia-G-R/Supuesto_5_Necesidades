import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';

const SLOT_KEYS = ['now', 'next', 'later'];
const SLOT_LABELS = { now: '⭐ AHORA', next: '🔜 DESPUÉS', later: '⏳ LUEGO' };

const PRESET_PICTOS = [
  { id: 2510,  label: 'Desayunar',  imageUrl: 'https://static.arasaac.org/pictograms/2510/2510_300.png' },
  { id: 6386,  label: 'Colegio',    imageUrl: 'https://static.arasaac.org/pictograms/6386/6386_300.png' },
  { id: 3196,  label: 'Jugar',      imageUrl: 'https://static.arasaac.org/pictograms/3196/3196_300.png' },
  { id: 38265, label: 'Comer',      imageUrl: 'https://static.arasaac.org/pictograms/38265/38265_300.png' },
  { id: 5580,  label: 'Dormir',     imageUrl: 'https://static.arasaac.org/pictograms/5580/5580_300.png' },
  { id: 2948,  label: 'Bañarse',    imageUrl: 'https://static.arasaac.org/pictograms/2948/2948_300.png' },
  { id: 7957,  label: 'Terapia',    imageUrl: 'https://static.arasaac.org/pictograms/7957/7957_300.png' },
  { id: 4676,  label: 'Pasear',     imageUrl: 'https://static.arasaac.org/pictograms/4676/4676_300.png' },
  { id: 29671, label: 'Leer',       imageUrl: 'https://static.arasaac.org/pictograms/29671/29671_300.png' },
];

export default function ScheduleEditor({ childId }) {
  const [slots, setSlots] = useState({ now: null, next: null, later: null });
  const [saved, setSaved] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState(null);

  useEffect(() => {
    api.get(`/schedule/${childId}/today`)
      .then(sched => {
        if (sched) setSlots({ now: sched.slot_now, next: sched.slot_next, later: sched.slot_later });
      })
      .catch(() => {});
  }, [childId]);

  function assignPicto(picto) {
    if (!selectingSlot) return;
    setSlots(prev => ({ ...prev, [selectingSlot]: { ...picto, completed: false } }));
    setSelectingSlot(null);
    setSaved(false);
  }

  async function handleSave() {
    try {
      await api.put(`/schedule/${childId}`, {
        slotNow: slots.now, slotNext: slots.next, slotLater: slots.later,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    }
  }

  return (
    <div style={s.wrap}>
      <h2 style={s.title}>📅 Configurar agenda de hoy</h2>
      <p style={s.sub}>Toca cada bloque para asignar una actividad</p>

      <div style={s.slots}>
        {SLOT_KEYS.map(key => (
          <div key={key} style={s.slotCard}>
            <div style={s.slotHeader}>{SLOT_LABELS[key]}</div>
            <button style={s.slotBody} onClick={() => setSelectingSlot(key)}>
              {slots[key] ? (
                <>
                  <img src={slots[key].imageUrl} alt={slots[key].label} style={s.pictoImg}
                       onError={e => e.target.style.display='none'} />
                  <span style={s.pictoLabel}>{slots[key].label}</span>
                  <span style={s.editHint}>Toca para cambiar</span>
                </>
              ) : (
                <span style={s.emptySlot}>+ Añadir actividad</span>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Picto picker */}
      {selectingSlot && (
        <div style={s.picker}>
          <div style={s.pickerHeader}>
            <h3 style={s.pickerTitle}>Elige una actividad para "{SLOT_LABELS[selectingSlot]}"</h3>
            <button style={s.closeBtn} onClick={() => setSelectingSlot(null)}>✕</button>
          </div>
          <div style={s.pickerGrid}>
            {PRESET_PICTOS.map(picto => (
              <button key={picto.id} style={s.pickerCard} onClick={() => assignPicto(picto)}>
                <img src={picto.imageUrl} alt={picto.label} style={s.pictoImg}
                     onError={e => e.target.style.display='none'} />
                <span style={s.pickerLabel}>{picto.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button style={{ ...s.saveBtn, ...(saved ? s.saveBtnSaved : {}) }} onClick={handleSave}>
        {saved ? '✅ Guardado' : '💾 Guardar agenda de hoy'}
      </button>
    </div>
  );
}

const s = {
  wrap: {
    flex: 1, overflowY: 'auto', padding: '24px',
    display: 'flex', flexDirection: 'column', gap: '20px',
    fontFamily: 'Nunito, sans-serif',
  },
  title: { fontSize: '22px', fontWeight: 900, color: '#1A1916' },
  sub: { fontSize: '15px', color: '#6B6960', fontWeight: 600, marginTop: '-12px' },
  slots: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  slotCard: {
    flex: '1 1 180px', background: '#fff', borderRadius: '20px',
    overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    border: '2px solid #E2E0D8',
  },
  slotHeader: {
    background: '#F1EFE8', padding: '10px 16px',
    fontSize: '13px', fontWeight: 900, color: '#1A1916', letterSpacing: '0.5px',
  },
  slotBody: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', padding: '20px', background: 'none', border: 'none',
    cursor: 'pointer', width: '100%', minHeight: '140px',
    justifyContent: 'center',
  },
  pictoImg: { width: '80px', height: '80px', objectFit: 'contain' },
  pictoLabel: { fontSize: '16px', fontWeight: 800, color: '#1A1916' },
  editHint: { fontSize: '11px', color: '#B0ADA4', fontWeight: 600 },
  emptySlot: { fontSize: '16px', fontWeight: 700, color: '#B0ADA4' },
  picker: {
    background: '#fff', borderRadius: '20px', padding: '20px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '2px solid #E2E0D8',
  },
  pickerHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '16px',
  },
  pickerTitle: { fontSize: '15px', fontWeight: 800, color: '#1A1916' },
  closeBtn: {
    width: '32px', height: '32px', borderRadius: '50%',
    background: '#F1EFE8', border: 'none', fontSize: '16px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  pickerGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '12px',
  },
  pickerCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    padding: '12px 8px', borderRadius: '16px', background: '#F8F7F4',
    border: '2px solid #E2E0D8', cursor: 'pointer', transition: 'all 0.15s',
  },
  pickerLabel: { fontSize: '12px', fontWeight: 700, color: '#1A1916', textAlign: 'center' },
  saveBtn: {
    padding: '16px 28px', borderRadius: '16px',
    background: '#534AB7', border: 'none', color: '#fff',
    fontSize: '18px', fontWeight: 800, cursor: 'pointer',
    boxShadow: '0 4px 16px rgba(83,74,183,0.3)',
    transition: 'all 0.3s', alignSelf: 'flex-start',
  },
  saveBtnSaved: { background: '#1D9E75', boxShadow: '0 4px 16px rgba(29,158,117,0.3)' },
};
