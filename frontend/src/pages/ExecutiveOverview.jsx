import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, UserCircle2, Heart, Plane, Link2,
  Activity, Clock, TrendingUp, AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import { getDashboardKPIs } from '../services/api';
import { useSocket } from '../context/SocketContext';
import styles from './ExecutiveOverview.module.css';

/* ── Animated counter ── */
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

/* ── KPI card ── */
const KpiCard = ({ card, idx }) => {
  const Icon = card.icon;
  return (
    <motion.div
      className={styles.kpiCard}
      style={{ '--accent': card.color }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.09, type: 'spring', stiffness: 200 }}
    >
      <div className={styles.kpiGlow} />
      <div className={styles.kpiTop}>
        <div className={styles.kpiIcon}><Icon size={20} /></div>
        {card.trend && (
          <span className={styles.kpiTrend}>
            <TrendingUp size={12} /> {card.trend}
          </span>
        )}
      </div>
      <h3 className={styles.kpiValue}>
        <AnimatedNumber value={card.value} />
      </h3>
      <span className={styles.kpiTitle}>{card.title}</span>
    </motion.div>
  );
};

/* ── Alert severity map ── */
const severityConfig = {
  critical: { cls: styles.alertCritical, Icon: AlertTriangle, color: 'var(--status-critical)' },
  warning:  { cls: styles.alertWarning,  Icon: AlertTriangle,  color: 'var(--status-warning)'  },
  success:  { cls: styles.alertSuccess,  Icon: CheckCircle2,  color: 'var(--status-online)'   },
  info:     { cls: styles.alertInfo,     Icon: Info,           color: 'var(--status-idle)'     },
};

const ExecutiveOverview = () => {
  const [kpis, setKpis]     = useState({ hospitalsCount:0, donorsCount:0, organsCount:0, missionsCount:0, blocksCount:0 });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts]  = useState([]);
  const [timeline, setTimeline] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    getDashboardKPIs()
      .then(d => setKpis(d))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('transport:alert', (payload) => {
      setAlerts(prev => [{
        id: Date.now(),
        type: 'TELEMETRY_ALERT',
        message: payload.alerts.join(', '),
        time: 'just now',
        severity: 'critical'
      }, ...prev].slice(0, 10));
    });

    socket.on('transport:health_change', (payload) => {
      setAlerts(prev => [{
        id: Date.now(),
        type: 'HEALTH_STATUS_CHANGED',
        message: `Mission health changed to ${payload.health.status}`,
        time: 'just now',
        severity: payload.health.status === 'CRITICAL' ? 'critical' : 'warning'
      }, ...prev].slice(0, 10));
    });

    socket.on('match:update', (payload) => {
      setAlerts(prev => [{
        id: Date.now(),
        type: 'MATCH_EVENT',
        message: `Match generated for Organ ${payload.organId}`,
        time: 'just now',
        severity: 'success'
      }, ...prev].slice(0, 10));
      
      setTimeline(prev => [{
        title: 'Match Generated',
        desc: `Match generated for Organ ${payload.organId}`,
        time: 'just now',
        color: 'var(--brand-blue)'
      }, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('transport:alert');
      socket.off('transport:health_change');
      socket.off('match:update');
    };
  }, [socket]);

  const statCards = [
    { title:'Hospitals',         value: kpis.hospitalsCount, icon: Building2,    color:'#60a5fa', trend:'+1 this month' },
    { title:'Active Donors',     value: kpis.donorsCount,    icon: UserCircle2,   color:'#fbbf24', trend:null            },
    { title:'Available Organs',  value: kpis.organsCount,    icon: Heart,         color:'#22d3a0', trend:'Live'          },
    { title:'Active Missions',   value: kpis.missionsCount,  icon: Plane,         color:'#60a5fa', trend:'In transit'    },
    { title:'Ledger Blocks',     value: kpis.blocksCount,    icon: Link2,         color:'#a78bfa', trend:'Immutable'     },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div className={styles.header} initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Command Center</h1>
          <p className={styles.subtitle}>Real-time platform telemetry and operational overview</p>
        </div>
        <div className={styles.liveIndicator}>
          <span className="live-dot" />
          <span>Live Feed</span>
        </div>
      </motion.div>

      {loading ? (
        <div className={styles.loadingGrid}>
          {Array(5).fill(0).map((_,i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : (
        <>
          {/* KPI Row */}
          <div className={styles.kpiGrid}>
            {statCards.map((c, i) => <KpiCard key={c.title} card={c} idx={i} />)}
          </div>

          {/* Lower panels */}
          <div className={styles.panels}>
            {/* Live Alerts */}
            <motion.section
              className={`glass-panel ${styles.panel}`}
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.4 }}
            >
              <div className={styles.panelHead}>
                <Activity size={18} style={{ color:'var(--brand-green)' }} />
                <h2 className={styles.panelTitle}>Live Alerts</h2>
                <span className={`badge badge-online ${styles.ml}`}>Live</span>
              </div>
              <div className={`${styles.alertList} panel-scroll`}>
                <AnimatePresence>
                  {alerts.map(a => {
                    const cfg = severityConfig[a.severity];
                    const SIcon = cfg.Icon;
                    return (
                      <motion.div
                        key={a.id}
                        layout
                        initial={{ opacity:0, height:0 }}
                        animate={{ opacity:1, height:'auto' }}
                        exit={{ opacity:0, height:0 }}
                        className={`${styles.alertItem} ${cfg.cls}`}
                      >
                        <SIcon size={14} style={{ color:cfg.color, flexShrink:0, marginTop:2 }} />
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

            {/* Timeline */}
            <motion.section
              className={`glass-panel ${styles.panel}`}
              initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.5 }}
            >
              <div className={styles.panelHead}>
                <Clock size={18} style={{ color:'var(--brand-blue)' }} />
                <h2 className={styles.panelTitle}>Activity Timeline</h2>
              </div>
              <div className={styles.timelineList}>
                {timeline.map((t, i) => (
                  <div key={i} className={styles.timelineItem}>
                    {i < timeline.length-1 && <div className={styles.timelineConnector} />}
                    <div className={styles.timelineDot} style={{ background: t.color, boxShadow:`0 0 8px ${t.color}` }} />
                    <div className={styles.timelineContent}>
                      <h4 className={styles.timelineTitle}>{t.title}</h4>
                      <p className={styles.timelineDesc}>{t.desc}</p>
                      <span className={styles.timelineTime}>{t.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* System Health mini-panel */}
            <motion.section
              className={`glass-panel ${styles.panel} ${styles.panelSmall}`}
              initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.6 }}
            >
              <div className={styles.panelHead}>
                <h2 className={styles.panelTitle}>System Health</h2>
              </div>
              {[
                { label:'API Server',      status:'ONLINE',  color:'var(--status-online)'   },
                { label:'MongoDB',         status:'ONLINE',  color:'var(--status-online)'   },
                { label:'Event Bus',       status:'ACTIVE',  color:'var(--status-online)'   },
                { label:'IoT Simulator',   status:'RUNNING', color:'var(--brand-amber)'     },
                { label:'Blockchain Ledger',status:'VALID',  color:'var(--brand-purple)'    },
              ].map(item => (
                <div key={item.label} className={styles.healthRow}>
                  <span className={styles.healthLabel}>{item.label}</span>
                  <span className={styles.healthDot} style={{ background: item.color, boxShadow:`0 0 6px ${item.color}` }} />
                  <span className={styles.healthStatus} style={{ color: item.color }}>{item.status}</span>
                </div>
              ))}
            </motion.section>
          </div>
        </>
      )}
    </div>
  );
};

export default ExecutiveOverview;
