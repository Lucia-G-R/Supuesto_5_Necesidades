import React, { useState, useEffect } from 'react';
import { useStore } from '../store.js';
import { useNavigate } from 'react-router-dom';
import PhraseBuilder    from './modules/PhraseBuilder.jsx';
import Anticipation     from './modules/Anticipation.jsx';
import EmotionRegulator from './modules/EmotionRegulator.jsx';
import Achievements     from './modules/Achievements.jsx';
import RewardPopup      from './shared/RewardPopup.jsx';

const MODULES = [
  { id: 'phrases',  icon: '💬', label: 'Hablar'   },
  { id: 'achievements', icon: '🏆', label: 'Logros' },
  { id: 'emotion',  icon: '❤️', label: 'Sentir'   },
  { id: 'schedule', icon: '📅', label: 'Mi día'   },
];

export default function ChildApp() {
  const user         = useStore(s => s.currentUser);
  const activeModule = useStore(s => s.activeModule);
  const setModule    = useStore(s => s.setModule);
  const logout       = useStore(s => s.logout);
  const navigate     = useNavigate();

  const [stars,   setStars]   = useState(142);
  const [reward,    setReward]    = useState(null);
  const [rewardKey, setRewardKey] = useState(0);

  function handleLogout() { logout(); navigate('/'); }

  function giveReward(data) {
  setReward(data);
  setRewardKey(k => k + 1);
  }
  function addStars(n) { setStars(s => s + n); }

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
            <span style={{ fontSize: '22px' }}>⭐</span>
            <span style={s.starsNum}>{stars}</span>
            <span style={s.starsLabel}> estrellas</span>
          </div>
        </header>

        {/* CONTENT */}
        <main style={s.content}>
          {activeModule === 'phrases'      && <PhraseBuilder    childId={user?.id} addStars={addStars} giveReward={giveReward} />}
          {activeModule === 'achievements' && <Achievements     stars={stars} />}
          {activeModule === 'emotion'      && <EmotionRegulator childId={user?.id} addStars={addStars} giveReward={giveReward} />}
          {activeModule === 'schedule'     && <Anticipation     childId={user?.id} />}
        </main>
      </div>

    {reward && (
      <RewardPopup
        key={rewardKey}
        monster={reward.monster}
        title={reward.title}
        sub={reward.sub}
        starCount={reward.starCount || 3}
        onClose={() => setReward(null)}
      />
    )}
    </div>
  );
}

const s = {
  shell: {
    height: '100dvh', display: 'grid',
    gridTemplateColumns: '100px 1fr',
    background: '#FFFBF4',
    overflow: 'hidden',
    fontFamily: "'Nunito', sans-serif",
  },
  sidebar: {
    background: '#FFFFFF',
    borderRight: '2px solid #F0ECE4',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '16px 0', gap: '6px',
  },
  logo: {
    width: '64px', height: '64px',
    background: '#F5A623', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '30px', marginBottom: '10px',
    boxShadow: '0 4px 14px rgba(245,166,35,.4)',
  },
  navBtn: {
    width: '74px', height: '74px', borderRadius: '20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: '4px',
    background: 'transparent', border: 'none', cursor: 'pointer',
    transition: 'all .2s',
  },
  navBtnActive: { background: '#FEF3D0' },
  navIcon:  { fontSize: '28px' },
  navLabel: { fontSize: '10px', fontWeight: 800, color: '#8A8780' },
  navLabelActive: { color: '#F5A623' },
  exitBtn: {
    marginTop: 'auto', width: '48px', height: '48px',
    borderRadius: '16px', background: '#FFF0EE',
    border: '2px solid #FFD6D2', fontSize: '22px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  main: {
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  topBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 24px',
    background: '#FFFFFF', borderBottom: '2px solid #F0ECE4',
    flexShrink: 0,
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
    display: 'flex', alignItems: 'center', gap: '6px',
    background: '#FEF3D0', border: '2px solid #F5A623',
    borderRadius: '99px', padding: '8px 16px',
  },
  starsNum:   { fontSize: '20px', fontWeight: 900, color: '#F5A623' },
  starsLabel: { fontSize: '13px', fontWeight: 700, color: '#D4920E' },
  content: { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' },
};
