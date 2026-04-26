import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { useStore } from '../../store.js';
import { api } from '../../utils/api.js';
import ScheduleEditor from './ScheduleEditor.jsx';

function pictoUrl(id) { return `https://static.arasaac.org/pictograms/${id}/${id}_300.png`; }

function fmtDuration(sec) {
  if (!sec) return '0m';
  const m = Math.round(sec / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function ChartCard({ title, subtitle, children, footer }) {
  return (
    <div style={dash.chartCard}>
      <div style={dash.chartHeader}>
        <h3 style={dash.chartTitle}>{title}</h3>
        {subtitle && <p style={dash.chartSubtitle}>{subtitle}</p>}
      </div>
      <div style={dash.chartBody}>{children}</div>
      {footer}
    </div>
  );
}

function NoData({ msg = 'Sin datos todavía' }) {
  return <div style={dash.noData}>{msg}</div>;
}

export default function AdultApp() {
  const user                = useStore(s => s.currentUser);
  const logout              = useStore(s => s.logout);
  const restoreChildSession = useStore(s => s.restoreChildSession);
  const pendingChildSession = useStore(s => s.pendingChildSession);
  const navigate            = useNavigate();

  const [children,  setChildren]  = useState([]);
  const [childId,   setChildId]   = useState(null);
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [range,     setRange]     = useState({ weeks: 8, days: 30 });
  const [usageMode, setUsageMode] = useState('weekly'); // 'daily' | 'weekly' | 'monthly'
  const [activeTab, setActiveTab] = useState('dashboard');

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

  function handleLogout() {
    if (pendingChildSession) {
      // El niño nos había prestado la pantalla. Devolver el control.
      restoreChildSession();
      navigate('/child');
    } else {
      logout();
      navigate('/');
    }
  }

  // Datos derivados
  const commProgress = data?.communicationProgress || [];
  const commType     = data?.communicationType || [];
  const usageDaily   = data?.appUsage?.daily || [];
  const usageWeekly  = data?.appUsage?.weekly || [];
  const usageMonthly = data?.appUsage?.monthly || [];
  const errors       = data?.errorsAndTime || {};
  const responseMs   = errors.responseMsByWeek || [];
  const social       = data?.socialInteraction || [];
  const topPictos    = data?.topPictograms || [];

  const usageData = usageMode === 'daily' ? usageDaily : usageMode === 'monthly' ? usageMonthly : usageWeekly;
  const usageKey  = usageMode === 'daily' ? 'date' : usageMode === 'monthly' ? 'month' : 'week';

  // Métrica del uso: minutos cuando hay datos de duración, sino eventos.
  const usageHasDuration = usageData.some(d => d.duration_sec > 0);
  const usageDataDisplay = usageData.map(d => ({
    ...d,
    minutes: Math.round((d.duration_sec || 0) / 60),
  }));

  // Para social: % social
  const socialDisplay = social.map(s => ({
    week: s.week,
    socialPct: s.total > 0 ? Math.round((s.social / s.total) * 100) : 0,
    social: s.social,
    total: s.total,
  }));

  return (
    <div style={dash.page}>
      <aside style={dash.sidebar}>
        <div style={dash.sideTop}>
          <div style={dash.sideIcon}>🗣️</div>
          <p style={dash.sideName}>{user?.name}</p>
          {pendingChildSession && (
            <span style={dash.pendingBadge}>Niño esperando</span>
          )}
        </div>

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

        <button style={dash.logoutBtn} onClick={handleLogout}>
          {pendingChildSession ? '↩ Volver con el niño' : '← Salir'}
        </button>
      </aside>

      <main style={dash.main}>
        {activeTab === 'schedule' && childId ? (
          <ScheduleEditor childId={childId} />
        ) : (
          <>
            <div style={dash.mainHeader}>
              <h1 style={dash.mainTitle}>📊 Progreso clínico</h1>
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
              <div style={dash.loadingMsg}>Sin datos. ¡El niño aún no ha usado la app!</div>
            ) : (
              <div style={dash.content}>

                {/* 1. PROGRESO DE COMUNICACIÓN — pictogramas vs palabras */}
                <ChartCard
                  title="1. Progreso de comunicación (pictogramas vs palabras)"
                  subtitle="El TEA afecta al desarrollo del lenguaje. Comparamos pictogramas tocados con palabras (frases) producidas."
                >
                  {commProgress.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={commProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDEA" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="pictos" name="Pictogramas" stroke="#534AB7" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="words"  name="Palabras (frases)" stroke="#1D9E75" strokeWidth={3} dot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* 2. USO DE LA APP — diario / semanal / mensual */}
                <ChartCard
                  title="2. Uso de la app"
                  subtitle="Patrones de uso (rutinas estructuradas son clave en el TEA)."
                  footer={
                    <div style={dash.subRangeRow}>
                      {['daily','weekly','monthly'].map(m => (
                        <button
                          key={m}
                          style={{ ...dash.subRangeBtn, ...(usageMode === m ? dash.subRangeBtnActive : {}) }}
                          onClick={() => setUsageMode(m)}
                        >
                          {m === 'daily' ? 'Diario' : m === 'weekly' ? 'Semanal' : 'Mensual'}
                        </button>
                      ))}
                    </div>
                  }
                >
                  {usageData.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={usageDataDisplay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDEA" />
                        <XAxis dataKey={usageKey} tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(v, n) => n === 'minutes'
                            ? [`${v} min`, 'Minutos']
                            : [`${v}`, 'Eventos']}
                        />
                        {usageHasDuration ? (
                          <Bar dataKey="minutes" fill="#1D9E75" name="Minutos" radius={[6,6,0,0]} />
                        ) : (
                          <Bar dataKey="events" fill="#1D9E75" name="Eventos" radius={[6,6,0,0]} />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* 3. TIPO DE COMUNICACIÓN — pictogramas sueltos vs frases */}
                <ChartCard
                  title="3. Tipo de comunicación (pictogramas sueltos vs frases)"
                  subtitle="Mide la complejidad lingüística: cuántas frases con 1 picto vs frases con 2+ pictos."
                >
                  {commType.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={commType}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDEA" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="single" stackId="a" name="1 pictograma" fill="#D4920E" radius={[0,0,0,0]} />
                        <Bar dataKey="multi"  stackId="a" name="2+ pictogramas" fill="#1D9E75" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* 4. ERRORES Y TIEMPO DE RESPUESTA */}
                <ChartCard
                  title="4. Errores y tiempo de respuesta"
                  subtitle="Detecta dificultades específicas. Tiempo entre que se ofrece el grid y se elige el primer pictograma."
                >
                  <div style={dash.dualPanel}>
                    <div style={dash.dualLeft}>
                      {responseMs.length === 0 ? <NoData msg="Sin medidas todavía" /> : (
                        <ResponsiveContainer width="100%" height={180}>
                          <LineChart data={responseMs}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F0EDEA" />
                            <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip formatter={v => [`${v} ms`, 'Tiempo medio']} />
                            <Line type="monotone" dataKey="avgMs" stroke="#FF6B5B" strokeWidth={3} dot={{ r: 4 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div style={dash.dualRight}>
                      <div style={dash.errorBox}>
                        <span style={dash.errorBig}>{errors.errorCount || 0}</span>
                        <span style={dash.errorLbl}>Errores totales</span>
                        <span style={dash.errorDetail}>
                          {errors.pictosRemoved || 0} pictogramas borrados<br />
                          {errors.phrasesCleared || 0} frases descartadas
                        </span>
                      </div>
                    </div>
                  </div>
                </ChartCard>

                {/* 5. INTERACCIÓN SOCIAL */}
                <ChartCard
                  title="5. Interacción social (pictogramas sociales)"
                  subtitle="Familia, emociones y fórmulas sociales (gracias, por favor, ayuda…)."
                >
                  {socialDisplay.length === 0 ? <NoData /> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={socialDisplay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0EDEA" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0,100]} />
                        <Tooltip
                          formatter={(v, n, item) =>
                            n === 'socialPct'
                              ? [`${v}% (${item.payload.social} / ${item.payload.total})`, 'Social']
                              : [v, n]
                          }
                        />
                        <Bar dataKey="socialPct" name="% social" fill="#7C5CFC" radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                {/* 6. PICTOGRAMAS MÁS UTILIZADOS */}
                <ChartCard
                  title="6. Pictogramas más utilizados"
                  subtitle="Preferencias e intereses focalizados — característico del TEA."
                >
                  {topPictos.length === 0 ? <NoData /> : (
                    <div style={dash.topGrid}>
                      {topPictos.map((p, i) => (
                        <div key={p.id} style={dash.topItem}>
                          <span style={dash.topRank}>#{i + 1}</span>
                          <img
                            src={pictoUrl(p.id)}
                            alt={p.label}
                            style={dash.topImg}
                            onError={e => e.target.style.opacity = '.3'}
                          />
                          <span style={dash.topLabel}>{p.label}</span>
                          <span style={dash.topCount}>{p.count}×</span>
                        </div>
                      ))}
                    </div>
                  )}
                </ChartCard>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

const dash = {
  page: { height: '100dvh', display: 'flex', fontFamily: 'Nunito, sans-serif', overflow: 'hidden', background: '#F8F7F4' },
  sidebar: {
    width: '210px', background: '#fff', borderRight: '1px solid #E2E0D8',
    display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: '16px', flexShrink: 0,
  },
  sideTop: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', paddingBottom: '16px', borderBottom: '1px solid #E2E0D8' },
  sideIcon: { fontSize: '36px' },
  sideName: { fontSize: '14px', fontWeight: 700, color: '#1A1916', textAlign: 'center' },
  pendingBadge: {
    background: '#FEF3D0', color: '#D4920E', padding: '4px 10px',
    borderRadius: '99px', fontSize: '11px', fontWeight: 800, marginTop: '4px',
  },
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
  },
  sideNavActive: { background: '#E1F5EE', color: '#1D9E75' },
  logoutBtn: {
    padding: '10px', borderRadius: '14px', background: 'none',
    border: '2px solid #E2E0D8', color: '#6B6960',
    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
    marginTop: 'auto',
  },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  mainHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 24px', background: '#fff', borderBottom: '1px solid #E2E0D8', flexShrink: 0,
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
  chartCard: {
    background: '#fff', borderRadius: '20px', padding: '20px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  chartHeader: { marginBottom: '12px' },
  chartTitle: { fontSize: '16px', fontWeight: 900, color: '#1A1916' },
  chartSubtitle: { fontSize: '12px', fontWeight: 600, color: '#6B6960', marginTop: '4px', lineHeight: 1.4 },
  chartBody: {},
  loadingMsg: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B6960', fontSize: '16px', fontWeight: 600 },
  noData: { height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B0ADA4', fontWeight: 600 },
  subRangeRow: { display: 'flex', gap: '8px', marginTop: '12px' },
  subRangeBtn: {
    padding: '6px 14px', borderRadius: '99px',
    border: '2px solid #E2E0D8', background: 'none',
    fontSize: '12px', fontWeight: 700, color: '#6B6960', cursor: 'pointer',
  },
  subRangeBtnActive: { background: '#FEF3D0', border: '2px solid #D4920E', color: '#D4920E' },
  dualPanel: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px', alignItems: 'center' },
  dualLeft: {},
  dualRight: { display: 'flex', justifyContent: 'center' },
  errorBox: {
    background: '#FFEDED', borderRadius: '20px', padding: '20px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
    border: '2px solid #FF6B5B', minWidth: '180px',
  },
  errorBig: { fontSize: '40px', fontWeight: 900, color: '#D85A30' },
  errorLbl: { fontSize: '13px', fontWeight: 800, color: '#1A1916' },
  errorDetail: { fontSize: '11px', fontWeight: 600, color: '#6B6960', textAlign: 'center', marginTop: '6px' },
  topGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', marginTop: '8px',
  },
  topItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '10px 6px', borderRadius: '14px',
    background: '#F8F7F4', border: '2px solid #E2E0D8',
    position: 'relative',
  },
  topRank: {
    position: 'absolute', top: '6px', left: '6px',
    background: '#1D9E75', color: '#fff', borderRadius: '99px',
    padding: '2px 8px', fontSize: '10px', fontWeight: 900,
  },
  topImg:   { width: '64px', height: '64px', objectFit: 'contain' },
  topLabel: { fontSize: '12px', fontWeight: 800, color: '#1A1916', textAlign: 'center' },
  topCount: { fontSize: '11px', fontWeight: 700, color: '#6B6960' },
};
