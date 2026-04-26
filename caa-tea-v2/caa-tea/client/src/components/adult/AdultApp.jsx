import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useStore } from '../../store.js';
import { api } from '../../utils/api.js';
import ScheduleEditor from './ScheduleEditor.jsx';

const COLORS_PIE = ['#D4920E','#2E7DC4','#D85A30','#534AB7','#A844A0','#1D9E75'];

function KpiCard({ label, value, unit, trend, color, icon }) {
  return (
    <div style={{ ...kpi.card, borderTop: `4px solid ${color}` }}>
      <div style={kpi.top}>
        <span style={kpi.icon}>{icon}</span>
        <span style={{ ...kpi.trend, color: trend > 0 ? '#1D9E75' : trend < 0 ? '#D85A30' : '#B0ADA4' }}>
          {trend > 0 ? '↑' : trend < 0 ? '↓' : '—'}
        </span>
      </div>
      <div style={{ ...kpi.value, color }}>{value ?? '—'}<span style={kpi.unit}> {unit}</span></div>
      <div style={kpi.label}>{label}</div>
    </div>
  );
}

export default function AdultApp() {
  const user     = useStore(s => s.currentUser);
  const logout   = useStore(s => s.logout);
  const navigate = useNavigate();

  const [children,  setChildren]  = useState([]);
  const [childId,   setChildId]   = useState(null);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [range,     setRange]     = useState({ weeks: 8, days: 30 });
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'schedule'

  useEffect(() => {
    api.get('/users/children')
      .then(ch => { setChildren(ch); if (ch[0]) setChildId(ch[0].id); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!childId) return;
    setLoading(true);
    api.get(`/dashboard/${childId}?weeks=${range.weeks}&days=${range.days}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [childId, range]);

  function handleLogout() { logout(); navigate('/'); }

  const lmf        = data?.lmfSeries || [];
  const freq       = data?.frequency  || [];
  const emotDist   = data?.emotionDistribution || [];
  const autonomy   = data?.emotionalAutonomy;
  const diversity  = data?.diversity?.count ?? 0;

  // Trend: compare last vs previous week LMF
  const lmfTrend = lmf.length >= 2
    ? (lmf[lmf.length-1]?.lmf || 0) - (lmf[lmf.length-2]?.lmf || 0)
    : 0;

  return (
    <div style={dash.page}>
      {/* Sidebar */}
      <aside style={dash.sidebar}>
        <div style={dash.sideTop}>
          <div style={dash.sideIcon}>🗣️</div>
          <p style={dash.sideName}>{user?.name}</p>
        </div>

        {/* Child selector */}
        {children.length > 0 && (
          <select
            style={dash.select}
            value={childId || ''}
            onChange={e => setChildId(e.target.value)}
          >
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <nav style={dash.sideNav}>
          {[
            { id: 'dashboard', icon: '📊', label: 'Progreso' },
            { id: 'schedule',  icon: '📅', label: 'Agenda' },
          ].map(item => (
            <button
              key={item.id}
              style={{ ...dash.sideNavBtn, ...(activeTab === item.id ? dash.sideNavActive : {}) }}
              onClick={() => setActiveTab(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <button style={dash.logoutBtn} onClick={handleLogout}>← Salir</button>
      </aside>

      {/* Main */}
      <main style={dash.main}>
        {activeTab === 'schedule' && childId ? (
          <ScheduleEditor childId={childId} />
        ) : (
          <>
            <div style={dash.mainHeader}>
              <h1 style={dash.mainTitle}>📊 Progreso</h1>
              <div style={dash.rangeRow}>
                {[
                  { label: '4 sem', weeks: 4, days: 30 },
                  { label: '8 sem', weeks: 8, days: 30 },
                  { label: '3 mes', weeks: 12, days: 90 },
                ].map(r => (
                  <button
                    key={r.label}
                    style={{ ...dash.rangeBtn, ...(range.weeks === r.weeks ? dash.rangeBtnActive : {}) }}
                    onClick={() => setRange({ weeks: r.weeks, days: r.days })}
                  >{r.label}</button>
                ))}
              </div>
            </div>

            {loading ? (
              <div style={dash.loadingMsg}>Cargando datos…</div>
            ) : !data ? (
              <div style={dash.loadingMsg}>Sin datos todavía. ¡El niño aún no ha usado la app!</div>
            ) : (
              <div style={dash.content}>
                {/* KPI Cards */}
                <div style={dash.kpiRow}>
                  <KpiCard
                    label="Longitud media de frase"
                    value={lmf[lmf.length-1]?.lmf || 0}
                    unit="pictos"
                    trend={lmfTrend}
                    color="#1D9E75"
                    icon="💬"
                  />
                  <KpiCard
                    label="Pictogramas distintos"
                    value={diversity}
                    unit="únicos"
                    trend={0}
                    color="#534AB7"
                    icon="🗂️"
                  />
                  <KpiCard
                    label="Autonomía emocional"
                    value={autonomy?.autonomy_rate || 0}
                    unit="%"
                    trend={0}
                    color="#D4920E"
                    icon="❤️"
                  />
                  <KpiCard
                    label="Registros emocionales"
                    value={autonomy?.total_logs || 0}
                    unit="total"
                    trend={0}
                    color="#D85A30"
                    icon="📝"
                  />
                </div>

                {/* LMF Chart */}
                <div style={dash.chartCard}>
                  <h3 style={dash.chartTitle}>Longitud media de frase por semana</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={lmf} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDEA" />
                      <XAxis dataKey="week" tickFormatter={v => new Date(v).toLocaleDateString('es',{month:'short',day:'numeric'})} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => [v + ' pictos', 'LMF']} />
                      <Line type="monotone" dataKey="lmf" stroke="#1D9E75" strokeWidth={3} dot={{ r: 5, fill: '#1D9E75' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Frequency + Emotion Donut */}
                <div style={dash.chartRow}>
                  <div style={dash.chartCard}>
                    <h3 style={dash.chartTitle}>Días activos por semana</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={freq} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDEA" />
                        <XAxis dataKey="week" tickFormatter={v => new Date(v).toLocaleDateString('es',{month:'short',day:'numeric'})} tick={{ fontSize: 10 }} />
                        <YAxis domain={[0,7]} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => [v + ' días', 'Activo']} />
                        <Bar dataKey="active_days" fill="#534AB7" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={dash.chartCard}>
                    <h3 style={dash.chartTitle}>Emociones registradas</h3>
                    {emotDist.length === 0 ? (
                      <div style={dash.noData}>Sin datos de emociones</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={emotDist}
                            dataKey="count"
                            nameKey="emotion"
                            cx="50%" cy="50%"
                            innerRadius={45} outerRadius={75}
                            paddingAngle={3}
                          >
                            {emotDist.map((_, i) => (
                              <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v, n) => [v, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                    <div style={dash.legend}>
                      {emotDist.map((em, i) => (
                        <div key={em.emotion} style={dash.legendItem}>
                          <div style={{ ...dash.legendDot, background: COLORS_PIE[i % COLORS_PIE.length] }} />
                          <span style={dash.legendLabel}>{em.emotion} ({em.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const kpi = {
  card: {
    background: '#fff', borderRadius: '20px',
    padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    flex: '1 1 160px', minWidth: '140px',
  },
  top: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px' },
  icon: { fontSize: '24px' },
  trend: { fontSize: '20px', fontWeight: 900 },
  value: { fontSize: '32px', fontWeight: 900, fontFamily: 'Nunito, sans-serif' },
  unit: { fontSize: '14px', fontWeight: 600, color: '#6B6960' },
  label: { fontSize: '12px', fontWeight: 700, color: '#6B6960', marginTop: '4px' },
};

const dash = {
  page: {
    height: '100dvh', display: 'flex',
    fontFamily: 'Nunito, sans-serif', overflow: 'hidden', background: '#F8F7F4',
  },
  sidebar: {
    width: '200px', background: '#fff', borderRight: '1px solid #E2E0D8',
    display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: '16px',
    flexShrink: 0,
  },
  sideTop: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid #E2E0D8' },
  sideIcon: { fontSize: '36px' },
  sideName: { fontSize: '14px', fontWeight: 700, color: '#1A1916', textAlign: 'center' },
  select: {
    width: '100%', padding: '8px 10px', borderRadius: '12px',
    border: '2px solid #E2E0D8', fontSize: '14px', fontWeight: 600,
    background: '#F8F7F4', cursor: 'pointer',
  },
  sideNav: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  sideNavBtn: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '10px 14px', borderRadius: '14px',
    background: 'none', border: 'none',
    fontSize: '15px', fontWeight: 700, color: '#6B6960', cursor: 'pointer',
    transition: 'all 0.15s',
  },
  sideNavActive: { background: '#E1F5EE', color: '#1D9E75' },
  logoutBtn: {
    padding: '10px', borderRadius: '14px', background: 'none',
    border: '2px solid #E2E0D8', color: '#6B6960',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
    marginTop: 'auto',
  },
  main: {
    flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
  },
  mainHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', background: '#fff', borderBottom: '1px solid #E2E0D8',
    flexShrink: 0,
  },
  mainTitle: { fontSize: '22px', fontWeight: 900, color: '#1A1916' },
  rangeRow: { display: 'flex', gap: '8px' },
  rangeBtn: {
    padding: '6px 14px', borderRadius: '99px',
    border: '2px solid #E2E0D8', background: 'none',
    fontSize: '13px', fontWeight: 700, color: '#6B6960', cursor: 'pointer',
  },
  rangeBtnActive: { background: '#E1F5EE', border: '2px solid #1D9E75', color: '#1D9E75' },
  content: { flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' },
  kpiRow: { display: 'flex', gap: '16px', flexWrap: 'wrap' },
  chartCard: {
    background: '#fff', borderRadius: '20px', padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', flex: 1, minWidth: '240px',
  },
  chartTitle: { fontSize: '15px', fontWeight: 800, color: '#1A1916', marginBottom: '12px' },
  chartRow: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  loadingMsg: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#6B6960', fontSize: '16px', fontWeight: 600,
  },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
  legendDot: { width: '10px', height: '10px', borderRadius: '50%' },
  legendLabel: { fontSize: '12px', fontWeight: 600, color: '#6B6960' },
  noData: { height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B0ADA4', fontWeight: 600 },
};
