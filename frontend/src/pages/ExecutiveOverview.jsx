import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, UserCircle2, Heart, Plane, Link2,
  Activity, Clock, TrendingUp, AlertTriangle, CheckCircle2,
  Info, ArrowUpRight, Zap, ShieldCheck
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getDashboardKPIs, getDonors, getOrgans, getMissions, getAllBlocks } from '../services/api';
import { useSocket } from '../context/SocketContext';
import styles from './ExecutiveOverview.module.css';

/* ─── Animated Counter ──────────────────────────────────────────── */
const AnimatedNumber = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = Number(value);
    if (end === 0) return;
    const step = Math.ceil(end / 30);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplay(start);
      if (start >= end) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display.toLocaleString()}</span>;
};

/* ─── Custom Recharts Tooltip ───────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color || p.fill }} />
          <span className={styles.tooltipName}>{p.name}:</span>
          <span className={styles.tooltipValue}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── KPI Card ──────────────────────────────────────────────────── */
const KpiCard = ({ card, idx }) => {
  const Icon = card.icon;
  const pct = Math.min(100, Math.max(10, Math.round((Number(card.value) / (card.maxRef || 20)) * 100)));
  const circ = 2 * Math.PI * 26;
  const offset = circ - (pct / 100) * circ;

  return (
    <motion.div
      className={styles.kpiCard}
      style={{ '--accent': card.color }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.09, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div className={styles.kpiGlow} />
      <div className={styles.kpiTop}>
        <div style={{ position: 'relative', width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="60" height="60" viewBox="0 0 60 60" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="30" cy="30" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5" fill="none" />
            <motion.circle
              cx="30" cy="30" r="26"
              stroke={card.color} strokeWidth="3.5" fill="none"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.4, delay: idx * 0.1, ease: 'easeOut' }}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
            />
          </svg>
          <div className={styles.kpiIcon} style={{ position: 'relative', zIndex: 2 }}>
            <Icon size={20} />
          </div>
        </div>
        {card.trend && (
          <span className={styles.kpiTrend} style={{ color: card.color }}>
            <ArrowUpRight size={11} /> {card.trend}
          </span>
        )}
      </div>
      <h3 className={styles.kpiValue}><AnimatedNumber value={card.value} /></h3>
      <span className={styles.kpiTitle}>{card.title}</span>
    </motion.div>
  );
};

/* ─── Severity config ────────────────────────────────────────────── */
const severityConfig = {
  critical: { cls: styles.alertCritical, Icon: AlertTriangle, color: 'var(--status-critical)' },
  warning:  { cls: styles.alertWarning,  Icon: AlertTriangle, color: 'var(--status-warning)'  },
  success:  { cls: styles.alertSuccess,  Icon: CheckCircle2,  color: 'var(--status-online)'   },
  info:     { cls: styles.alertInfo,     Icon: Info,          color: 'var(--status-idle)'     },
};

/* ─── 7-day activity real data generator ──────────────────────────── */
const generateRealActivityData = (blocks) => {
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      Missions: 0,
      Donors: 0,
      Organs: 0,
    };
  });

  if (Array.isArray(blocks)) {
    blocks.forEach(b => {
      if (!b.timestamp) return;
      const d = new Date(b.timestamp);
      const dayMatch = last7Days.find(x => x.date.getDate() === d.getDate() && x.date.getMonth() === d.getMonth() && x.date.getFullYear() === d.getFullYear());
      if (dayMatch) {
        const typeStr = `${b.entityType || ''} ${b.eventType || ''}`.toUpperCase();
        if (typeStr.includes('TRANSPORT') || typeStr.includes('MISSION') || typeStr.includes('TELEMETRY')) dayMatch.Missions++;
        else if (typeStr.includes('DONOR')) dayMatch.Donors++;
        else if (typeStr.includes('ORGAN')) dayMatch.Organs++;
      }
    });
  }
  return last7Days;
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
const ExecutiveOverview = () => {
  const [kpis, setKpis]           = useState({ hospitalsCount: 0, donorsCount: 0, organsCount: 0, missionsCount: 0, blocksCount: 0 });
  const [loading, setLoading]     = useState(true);
  const [alerts, setAlerts]       = useState([]);
  const [timeline, setTimeline]   = useState([]);
  const [organStatusData, setOrganStatusData]   = useState([]);
  const [organTypeData, setOrganTypeData]       = useState([]);
  const [missionStatusData, setMissionStatusData] = useState([]);
  const [activityData, setActivityData]         = useState([]);
  const [blockTrend, setBlockTrend]             = useState([]);
  const socket = useSocket();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [kpiData, donors, organs, missions, blocks] = await Promise.allSettled([
          getDashboardKPIs(),
          getDonors(),
          getOrgans(),
          getMissions(),
          getAllBlocks(),
        ]);

        const k = kpiData.status === 'fulfilled' ? kpiData.value : {};
        setKpis(k);

        // --- Organ Status Chart ---
        const organList = organs.status === 'fulfilled' ? (Array.isArray(organs.value) ? organs.value : organs.value?.organs || []) : [];
        const statusCounts = organList.reduce((acc, o) => {
          const s = o.status || 'UNKNOWN';
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
        const statusMap = {
          AWAITING_ALLOCATION: 'Awaiting',
          ALLOCATED: 'Allocated',
          IN_TRANSIT: 'In Transit',
          TRANSPLANTED: 'Transplanted',
          REJECTED: 'Rejected',
        };
        const organStatusArr = Object.entries(statusCounts).map(([k, v]) => ({
          status: statusMap[k] || k,
          count: v,
        }));
        setOrganStatusData(organStatusArr);

        // --- Organ Type Donut ---
        const typeCounts = organList.reduce((acc, o) => {
          const t = o.organType || 'OTHER';
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {});
        const organTypeArr = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
        setOrganTypeData(organTypeArr);

        // --- Mission Status Radial ---
        const missionList = missions.status === 'fulfilled' ? (Array.isArray(missions.value) ? missions.value : missions.value?.missions || []) : [];
        const mStatusCounts = missionList.reduce((acc, m) => {
          acc[m.status] = (acc[m.status] || 0) + 1;
          return acc;
        }, {});
        setMissionStatusData([
          { name: 'Completed',  value: mStatusCounts['COMPLETED'] || 0,   fill: '#22d3a0' },
          { name: 'In Transit', value: mStatusCounts['IN_TRANSIT'] || 0,  fill: '#60a5fa' },
          { name: 'Pending',    value: mStatusCounts['PENDING'] || 0,     fill: '#fbbf24' },
          { name: 'Cancelled',  value: mStatusCounts['CANCELLED'] || 0,   fill: '#f87171' },
        ].filter(d => d.value > 0));

        // --- 7-Day Activity Area Chart ---
        const blockList = blocks.status === 'fulfilled' ? (Array.isArray(blocks.value) ? blocks.value : []) : [];
        setActivityData(generateRealActivityData(blockList));

        // --- Block growth trend (last 7 blocks grouped) ---
        if (blockList.length > 0) {
          const sortedBlocks = [...blockList].sort((a, b) => (a.blockIndex ?? 0) - (b.blockIndex ?? 0));
          const step = Math.max(1, Math.floor(sortedBlocks.length / 8));
          const trend = sortedBlocks.filter((_, i) => i % step === 0 || i === sortedBlocks.length - 1).map(b => ({
            block: `#${b.blockIndex}`,
            Blocks: (b.blockIndex ?? 0) + 1,
          }));
          setBlockTrend(trend);
        } else {
          setBlockTrend([]);
        }

        // --- Timeline from recent missions ---
        const timelineItems = missionList.slice(0, 5).map(m => ({
          title: `Mission ${m.missionId || m._id?.toString().slice(-6)}`,
          desc: `Status: ${m.status}`,
          time: m.updatedAt ? new Date(m.updatedAt).toLocaleTimeString() : 'recently',
          color: m.status === 'COMPLETED' ? 'var(--brand-green)' : m.status === 'IN_TRANSIT' ? 'var(--brand-blue)' : 'var(--brand-amber)',
        }));
        if (timelineItems.length > 0) setTimeline(timelineItems);

      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  /* ── Socket live updates ── */
  useEffect(() => {
    if (!socket) return;
    socket.on('transport:alert', (payload) => {
      setAlerts(prev => [{ id: Date.now(), type: 'TELEMETRY_ALERT', message: payload.alerts?.join(', ') || 'Alert received', time: 'just now', severity: 'critical' }, ...prev].slice(0, 10));
    });
    socket.on('transport:health_change', (payload) => {
      setAlerts(prev => [{ id: Date.now(), type: 'HEALTH_CHANGED', message: `Mission health → ${payload.health?.status}`, time: 'just now', severity: payload.health?.status === 'CRITICAL' ? 'critical' : 'warning' }, ...prev].slice(0, 10));
    });
    socket.on('match:update', (payload) => {
      setAlerts(prev => [{ id: Date.now(), type: 'MATCH_GENERATED', message: `New match for Organ ${payload.organId}`, time: 'just now', severity: 'success' }, ...prev].slice(0, 10));
      setTimeline(prev => [{ title: 'Match Generated', desc: `Organ ${payload.organId} matched`, time: 'just now', color: 'var(--brand-blue)' }, ...prev].slice(0, 5));
    });
    return () => { socket.off('transport:alert'); socket.off('transport:health_change'); socket.off('match:update'); };
  }, [socket]);

  const statCards = [
    { title: 'Hospitals',        value: kpis.hospitalsCount, icon: Building2,   color: '#60a5fa', trend: 'Registered',  maxRef: 10 },
    { title: 'Active Donors',    value: kpis.donorsCount,    icon: UserCircle2,  color: '#fbbf24', trend: 'On Platform', maxRef: 20 },
    { title: 'Available Organs', value: kpis.organsCount,    icon: Heart,        color: '#22d3a0', trend: 'Live',        maxRef: 15 },
    { title: 'Active Missions',  value: kpis.missionsCount,  icon: Plane,        color: '#f472b6', trend: 'In Transit',  maxRef: 10 },
    { title: 'Ledger Blocks',    value: kpis.blocksCount,    icon: Link2,        color: '#a78bfa', trend: 'Immutable',   maxRef: 50 },
  ];

  /* ── Organ type colors ── */
  const TYPE_COLORS = ['#22d3a0', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#f87171'];
  const STATUS_COLORS = { Awaiting: '#fbbf24', Allocated: '#60a5fa', 'In Transit': '#22d3a0', Transplanted: '#a78bfa', Rejected: '#f87171' };

  if (loading) return (
    <div className="page-container">
      <div className={styles.loadingGrid}>
        {Array(5).fill(0).map((_, i) => <div key={i} className={styles.skeleton} />)}
      </div>
      <div className={styles.loadingCharts}>
        {Array(4).fill(0).map((_, i) => <div key={i} className={styles.skeletonChart} />)}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Command Center</h1>
          <p className={styles.subtitle}>Real-time platform telemetry, analytics & operational overview</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className={styles.statPill}>
            <Zap size={12} style={{ color: '#fbbf24' }} />
            <span>Live Analytics</span>
          </div>
          <div className={styles.liveIndicator}>
            <span className="live-dot" />
            <span>Live Feed</span>
          </div>
        </div>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className={styles.kpiGrid}>
        {statCards.map((c, i) => <KpiCard key={c.title} card={c} idx={i} />)}
      </div>

      {/* ── Charts Row 1: Area + Bar ── */}
      <div className={styles.chartsRow}>
        {/* 7-Day Activity Area Chart */}
        <motion.div
          className={`glass-panel ${styles.chartPanel}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <TrendingUp size={16} style={{ color: 'var(--brand-green)' }} />
              <h2 className={styles.chartTitle}>Platform Activity — 7-Day Trend</h2>
            </div>
            <span className="badge badge-online">Live</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradMissions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDonors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOrgans" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="day" tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#9090b0' }} />
              <Area type="monotone" dataKey="Missions" stroke="#60a5fa" strokeWidth={2} fill="url(#gradMissions)" dot={false} />
              <Area type="monotone" dataKey="Donors"   stroke="#22d3a0" strokeWidth={2} fill="url(#gradDonors)"  dot={false} />
              <Area type="monotone" dataKey="Organs"   stroke="#f472b6" strokeWidth={2} fill="url(#gradOrgans)"  dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Organ Status Bar Chart */}
        <motion.div
          className={`glass-panel ${styles.chartPanel}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        >
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <Heart size={16} style={{ color: 'var(--brand-red)' }} />
              <h2 className={styles.chartTitle}>Organ Lifecycle Status</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={organStatusData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="status" tick={{ fill: '#9090b0', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Organs" radius={[6, 6, 0, 0]}>
                {organStatusData.map((entry, index) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.status] || '#60a5fa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Charts Row 2: Donut + Radial ── */}
      <div className={styles.chartsRowSmall}>
        {/* Organ Type Donut */}
        <motion.div
          className={`glass-panel ${styles.chartPanelSm}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        >
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <ShieldCheck size={16} style={{ color: 'var(--brand-blue)' }} />
              <h2 className={styles.chartTitle}>Organ Type Distribution</h2>
            </div>
          </div>
          <div className={styles.donutWrapper}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={organTypeData}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {organTypeData.map((_, index) => (
                    <Cell key={index} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutLegend}>
              {organTypeData.map((entry, i) => (
                <div key={entry.name} className={styles.donutLegendItem}>
                  <span className={styles.donutDot} style={{ background: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                  <span className={styles.donutLegendName}>{entry.name}</span>
                  <span className={styles.donutLegendValue}>{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mission Status Radial */}
        <motion.div
          className={`glass-panel ${styles.chartPanelSm}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        >
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <Plane size={16} style={{ color: 'var(--brand-blue)' }} />
              <h2 className={styles.chartTitle}>Mission Status Breakdown</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart
              cx="50%" cy="50%"
              innerRadius={25} outerRadius={80}
              data={missionStatusData}
              startAngle={180} endAngle={-180}
            >
              <RadialBar minAngle={10} dataKey="value" cornerRadius={6} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 11, color: '#9090b0' }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Blockchain Block Growth */}
        <motion.div
          className={`glass-panel ${styles.chartPanelSm}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        >
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleGroup}>
              <Link2 size={16} style={{ color: 'var(--brand-purple)' }} />
              <h2 className={styles.chartTitle}>Ledger Block Growth</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={blockTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlocks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="block" tick={{ fill: '#9090b0', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="Blocks" stroke="#a78bfa" strokeWidth={2} fill="url(#gradBlocks)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* ── Bottom Panels ── */}
      <div className={styles.panels}>
        {/* Live Alerts */}
        <motion.section
          className={`glass-panel ${styles.panel}`}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}
        >
          <div className={styles.panelHead}>
            <Activity size={18} style={{ color: 'var(--brand-green)' }} />
            <h2 className={styles.panelTitle}>Live Alerts</h2>
            <span className="badge badge-online" style={{ marginLeft: 'auto' }}>Live</span>
          </div>
          <div className={`${styles.alertList} panel-scroll`}>
            <AnimatePresence>
              {alerts.length === 0 && (
                <div className={styles.emptyState}>
                  <CheckCircle2 size={28} style={{ color: 'var(--status-online)', opacity: 0.5 }} />
                  <p>All systems nominal — no active alerts</p>
                </div>
              )}
              {alerts.map(a => {
                const cfg = severityConfig[a.severity] || severityConfig.info;
                const SIcon = cfg.Icon;
                return (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`${styles.alertItem} ${cfg.cls}`}
                  >
                    <SIcon size={14} style={{ color: cfg.color, flexShrink: 0, marginTop: 2 }} />
                    <div className={styles.alertBody}>
                      <span className={styles.alertType}>{a.type}</span>
                      <p className={styles.alertMsg}>{a.message}</p>
                      <span className={styles.alertTime}>{a.time}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.section>

        {/* Activity Timeline */}
        <motion.section
          className={`glass-panel ${styles.panel}`}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.7 }}
        >
          <div className={styles.panelHead}>
            <Clock size={18} style={{ color: 'var(--brand-blue)' }} />
            <h2 className={styles.panelTitle}>Activity Timeline</h2>
          </div>
          <div className={styles.timelineList}>
            {timeline.length === 0 && (
              <div className={styles.emptyState}>
                <Clock size={28} style={{ opacity: 0.3 }} />
                <p>No recent activity recorded</p>
              </div>
            )}
            {timeline.map((t, i) => (
              <div key={i} className={styles.timelineItem}>
                {i < timeline.length - 1 && <div className={styles.timelineConnector} />}
                <div className={styles.timelineDot} style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                <div className={styles.timelineContent}>
                  <h4 className={styles.timelineTitle}>{t.title}</h4>
                  <p className={styles.timelineDesc}>{t.desc}</p>
                  <span className={styles.timelineTime}>{t.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* System Health */}
        <motion.section
          className={`glass-panel ${styles.panel} ${styles.panelSmall}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
        >
          <div className={styles.panelHead}>
            <ShieldCheck size={18} style={{ color: 'var(--brand-purple)' }} />
            <h2 className={styles.panelTitle}>System Health</h2>
          </div>
          {[
            { label: 'API Server',       status: 'ONLINE',   color: 'var(--status-online)'  },
            { label: 'MongoDB Atlas',    status: 'ONLINE',   color: 'var(--status-online)'  },
            { label: 'Event Bus',        status: 'ACTIVE',   color: 'var(--status-online)'  },
            { label: 'IoT Simulator',    status: 'RUNNING',  color: 'var(--brand-amber)'    },
            { label: 'Blockchain Ledger',status: 'VALID',    color: 'var(--brand-purple)'   },
            { label: 'THOTA Compliance', status: 'ENFORCED', color: '#22d3a0'               },
          ].map(item => (
            <div key={item.label} className={styles.healthRow}>
              <span className={styles.healthLabel}>{item.label}</span>
              <div className={styles.healthRight}>
                <span className={styles.healthDot} style={{ background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                <span className={styles.healthStatus} style={{ color: item.color }}>{item.status}</span>
              </div>
            </div>
          ))}
        </motion.section>
      </div>
    </div>
  );
};

export default ExecutiveOverview;
