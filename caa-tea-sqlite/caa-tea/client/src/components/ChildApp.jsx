import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store.js';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import PhraseBuilder    from './modules/PhraseBuilder.jsx';
import Anticipation     from './modules/Anticipation.jsx';
import EmotionRegulator from './modules/EmotionRegulator.jsx';
import Achievements     from './modules/Achievements.jsx';
import RewardPopup      from './shared/RewardPopup.jsx';

const LEVEL_EMOJIS = { 2:'🔥', 3:'⭐', 4:'🦋', 5:'🌈', 6:'🍄', 7:'🐢', 8:'🐲', 9:'🐙', 10:'🦄' };
const LEVEL_NAMES  = { 2:'Llamita', 3:'Estrellux', 4:'Aletita', 5:'Arcorín', 6:'Fungito', 7:'Tortulín', 8:'Dragoncito', 9:'Pulgito', 10:'Unicornio' };

const MODULES = [
  { id: 'phrases',      icon: '💬', label: 'Hablar' },
  { id: 'achievements', icon: '🏆', label: 'Logros' },
  { id: 'emotion',      icon: '❤️', label: 'Sentir' },
  { id: 'schedule',     icon: '📅', label: 'Mi día' },
];

export default function ChildApp() {
  const user             = useStore(s => s.currentUser);
  const activeModule     = useStore(s => s.activeModule);
  const setModule        = useStore(s => s.setModule);
  const logout           = useStore(s => s.logout);
  const stashChildSession= useStore(s => s.stashChildSession);
  const progress         = useStore(s => s.progress);
  const setProgress      = useStore(s => s.setProgress);
  const navigate         = useNavigate();

  const [reward, setReward] = useState(null);
  const sessionStart = useRef(Date.now());
  const lastLevel    = useRef(null);

  // Cargar progreso real al montar
  useEffect(() => {
    if (!user?.id) return;
    api.get('/progress/' + user.id).then(p => {
      lastLevel.current = p?.level ?? 1;
      setProgress(p);
    }).catch(() => {});
    api.post('/users/event', { event_type: 'session_start' }).catch(() => {});
  }, [user?.id, setProgress]);

  function handleProgress(p) {
    if (!p) return;
    if (lastLevel.current != null && p.level > lastLevel.current) {
      setReward({
        monster: LEVEL_EMOJIS[p.level] || '⭐',
        title:   `¡Nivel ${p.level}!`,
        sub:     `${LEVEL_NAMES[p.level] || 'Nuevo amigo'} se ha unido a ti`,
        starCount: 3,
      });
    }
    lastLevel.current = p.level;
    setProgress(p);
  }
  function giveReward(data) { setReward(data); }

  async function handleLogout() {
    const durationSec = Math.round((Date.now() - sessionStart.current) / 1000);
    try { await api.post('/users/event', { event_type: 'session_end', details: { duration_sec: durationSec } }); } catch {}
    logout();
    navigate('/');
  }

  function handleHelpAdult() {
    if (!confirm('¿Quieres llamar a un adulto?')) return;
    api.post('/users/event', { event_type: 'help_requested' }).catch(() => {});
    stashChildSession();
    navigate('/adult');
  }

  return (
    <div style={s.shell}>
      {/* SIDEBAR */}
      <aside style={s.sidebar}>
        <div style={s.logo}>🗣️</div>
        {MODULES.map(m => (
          <button
            key={m.id}
            style={{ ...s.navBtn, ...(activeModule === m.id ? s.navBtnActive : {}) }}
            onClick={() => setModule(m.id)}
          >
            <span style={s.navIcon}>{m.icon}</span>
            <span style={{ ...s.navLabel, ...(activeModule === m.id ? s.navLabelActive : {}) }}>
              {m.label}
            </span>
          </button>
        ))}
        <button style={s.exitBtn} onClick={handleLogout}>🚪</button>
      </aside>

      {/* MAIN */}
      <div style={s.main}>
        {/* TOP BAR */}
        <header style={s.topBar}>
          <div style={s.greeting}>
            <div style={s.avatar}>🧒</div>
            <span style={s.greetName}>¡Hola, {user?.name}! 👋</span>
          </div>
          <div style={s.starsPill}>
            <span style={s.lvlBadge}>Nv {progress?.level ?? 1}</span>
            <span style={{ fontSize: '22px' }}>⭐</span>
            <span style={s.starsNum}>{progress?.total_stars ?? 0}</span>
          </div>
        </header>

        {/* CONTENT */}
        <main style={s.content}>
          {activeModule === 'phrases'      && <PhraseBuilder    childId={user?.id} onProgress={handleProgress} giveReward={giveReward} />}
          {activeModule === 'achievements' && <Achievements     progress={progress} />}
          {activeModule === 'emotion'      && <EmotionRegulator childId={user?.id} onProgress={handleProgress} giveReward={giveReward} />}
          {activeModule === 'schedule'     && <Anticipation     childId={user?.id} onProgress={handleProgress} />}
        </main>
      </div>

      {/* BOTÓN FLOTANTE: AYUDA ADULTO */}
      <button style={s.helpFab} onClick={handleHelpAdult} title="Llamar a un adulto">
        🤝
        <span style={s.helpFabLabel}>Adulto</span>
      </button>

      {/* REWARD POPUP */}
      {reward && (
        <RewardPopup
          {...reward}
          onClose={() => setReward(null)}
        />
      )}
    </div>
  );
}

const s = {
  shell: {
    height: '100dvh', display: 'grid', gridTemplateColumns: '100px 1fr',
    background: '#FFFBF4', overflow: 'hidden', fontFamily: "'Nunito', sans-serif",
    position: 'relative',
  },
  sidebar: {
    background: '#FFFFFF', borderRight: '2px solid #F0ECE4',
    display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '6px',
  },
  logo: {
    width: '64px', height: '64px', background: '#F5A623', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '30px', marginBottom: '10px', boxShadow: '0 4px 14px rgba(245,166,35,.4)',
  },
  navBtn: {
    width: '74px', height: '74px', borderRadius: '20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
    background: 'transparent', border: 'none', cursor: 'pointer',
  },
  navBtnActive: { background: '#FEF3D0' },
  navIcon:  { fontSize: '28px' },
  navLabel: { fontSize: '10px', fontWeight: 800, color: '#8A8780' },
  navLabelActive: { color: '#F5A623' },
  exitBtn: {
    marginTop: 'auto', width: '48px', height: '48px',
    borderRadius: '16px', background: '#FFF0EE',
    border: '2px solid #FFD6D2', fontSize: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  main: { display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px', background: '#FFFFFF', borderBottom: '2px solid #F0ECE4', flexShrink: 0,
  },
  greeting: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '46px', height: '46px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#1D9E75,#4A90E2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '24px', border: '3px solid #C8F0E1',
  },
  greetName: { fontSize: '20px', fontWeight: 900, color: '#1A1916' },
  starsPill: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#FEF3D0', border: '2px solid #F5A623',
    borderRadius: '99px', padding: '8px 16px',
  },
  lvlBadge: {
    background: '#F5A623', color: '#fff', borderRadius: '12px',
    padding: '2px 8px', fontSize: '12px', fontWeight: 900, letterSpacing: '.5px',
  },
  starsNum: { fontSize: '20px', fontWeight: 900, color: '#F5A623' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  helpFab: {
    position: 'fixed', right: '24px', bottom: '24px',
    background: '#534AB7', color: '#fff', border: 'none',
    width: '76px', height: '76px', borderRadius: '50%',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    fontSize: '28px', cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(83,74,183,.4)',
    fontFamily: "'Nunito', sans-serif", zIndex: 100,
  },
  helpFabLabel: { fontSize: '10px', fontWeight: 900, marginTop: '2px' },
};
