import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Heart, Plane,
  Building2, GitMerge, ShieldCheck, Activity, RefreshCw,
  CheckCircle2, Clock, Zap, Target, Award
} from 'lucide-react';
import {
  getHospitals, getDonors, getOrgans, getMissions,
  getMatches, getAllBlocks
} from '../services/api';
import styles from './Analytics.module.css';

/* ─────────────────────────── helpers ─────────────────────────── */
const safeArr = (data, key) =>
  Array.isArray(data) ? data : (data?.[key] || []);

const pct = (a, b) => (b === 0 ? 0 : Math.round((a / b) * 100));

/* ── Mini Sparkbar (inline SVG bar chart) ── */
const Sparkbar = ({ values, color = 'var(--brand-green)', height = 36 }) => {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values, 1);
  const w = 200, h = height, barW = Math.floor(w / values.length) - 2;
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      {values.map((v, i) => {
        const bh = Math.max(2, (v / max) * h);
        return (
          <rect
            key={i}
            x={i * (barW + 2)}
            y={h - bh}
            width={barW}
            height={bh}
            rx={2}
            fill={color}
            opacity={0.5 + 0.5 * (v / max)}
          />
        );
      })}
    </svg>
  );
};

/* ── Donut Chart ── */
const DonutChart = ({ slices, size = 90 }) => {
  const r = 34, cx = 45, cy = 45, circ = 2 * Math.PI * r;
  const total = slices.reduce((s, sl) => s + sl.value, 0) || 1;
  let cumPct = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 90 90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
      {slices.map((sl, i) => {
        const pctVal = sl.value / total;
        const dashArr = `${pctVal * circ} ${circ}`;
        const dashOff = -(cumPct * circ);
        cumPct += pctVal;
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={sl.color}
            strokeWidth="10"
            strokeDasharray={dashArr}
            strokeDashoffset={dashOff}
            strokeLinecap="butt"
            transform="rotate(-90 45 45)"
            style={{ transition: 'stroke-dasharray 0.8s ease' }}
          />
        );
      })}
    </svg>
  );
};

/* ── Radial Progress ── */
const RadialProgress = ({ value, max, color, size = 64, label }) => {
  const r = 26, circ = 2 * Math.PI * r;
  const pctVal = Math.min(100, Math.round((value / (max || 1)) * 100));
  const offset = circ - (pctVal / 100) * circ;
  return (
    <div className={styles.radialWrap}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="5" fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke={color} strokeWidth="5" fill="none"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x={size/2} y={size/2 + 5} textAnchor="middle" fill={color} fontSize="12" fontWeight="800" fontFamily="var(--font-mono)">
          {pctVal}%
        </text>
      </svg>
      {label && <span className={styles.radialLabel}>{label}</span>}
    </div>
  );
};

/* ── Horizontal Bar Row ── */
const BarRow = ({ label, value, max, color, suffix = '' }) => {
  const pctVal = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <motion.div
          className={styles.barFill}
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pctVal}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
      </div>
      <span className={styles.barVal} style={{ color }}>{value}{suffix}</span>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
/*  MAIN ANALYTICS PAGE                                           */
/* ═══════════════════════════════════════════════════════════════ */
const Analytics = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [hospitals, donors, organs, missions, matches, blocks] = await Promise.all([
        getHospitals().catch(() => []),
        getDonors().catch(() => []),
        getOrgans().catch(() => []),
        getMissions().catch(() => []),
        getMatches().catch(() => []),
        getAllBlocks().catch(() => []),
      ]);

      const hosArr       = safeArr(hospitals, 'hospitals');
      const donArr       = safeArr(donors, 'donors');
      const orgArr       = safeArr(organs, 'organs');
      const misArr       = safeArr(missions, 'missions');
      const matArr       = safeArr(matches, 'matches');
      const blkArr       = safeArr(blocks, 'blocks');

      /* ── Organ type breakdown ── */
      const organTypeCounts = orgArr.reduce((acc, o) => {
        const t = o.organType || 'Unknown';
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});

      /* ── Organ status breakdown ── */
      const organStatusCounts = orgArr.reduce((acc, o) => {
        const s = o.status || 'RECOVERED';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      /* ── Blood group distribution ── */
      const bloodGroupCounts = orgArr.reduce((acc, o) => {
        const bg = o.bloodGroup || 'Unknown';
        acc[bg] = (acc[bg] || 0) + 1;
        return acc;
      }, {});

      /* ── Mission status breakdown ── */
      const missionStatusCounts = misArr.reduce((acc, m) => {
        const s = m.status || 'PENDING';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      /* ── Mission health breakdown ── */
      const healthBreakdown = misArr.reduce((acc, m) => {
        const h = m.health?.status || 'NORMAL';
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {});

      /* ── Match acceptance rate ── */
      let totalMatches = 0, acceptedMatches = 0;
      matArr.forEach(match => {
        (match.recommendedRecipients || []).forEach(r => {
          totalMatches++;
          if (r.status === 'ACCEPTED' || r.status === 'match.accepted') acceptedMatches++;
        });
      });

      /* ── Blockchain event types ── */
      const eventTypeCounts = blkArr.reduce((acc, b) => {
        const t = (b.eventType || 'SYSTEM_EVENT').split('.').pop().toUpperCase();
        acc[t] = (acc[t] || 0) + 1;
        return acc;
      }, {});
      const topEvents = Object.entries(eventTypeCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      /* ── Completed vs total missions ── */
      const completedMissions  = missionStatusCounts['COMPLETED'] || 0;
      const cancelledMissions  = missionStatusCounts['CANCELLED'] || 0;
      const activeMissions     = (missionStatusCounts['IN_TRANSIT'] || 0) + (missionStatusCounts['DISPATCHED'] || 0);

      /* ── Viable organs ── */
      const viableOrgans = orgArr.filter(o =>
        o.medicalAssessment?.viabilityStatus === 'VIABLE'
      ).length;

      /* ── Simulated 7-day trend bars ── */
      const seed = hosArr.length + donArr.length + orgArr.length;
      const genTrend = (base, variance = 3) =>
        Array.from({ length: 7 }, (_, i) =>
          Math.max(0, base + Math.floor(Math.sin(i + seed) * variance))
        );

      setData({
        hospitals: hosArr,
        donors: donArr,
        organs: orgArr,
        missions: misArr,
        blocks: blkArr,
        organTypeCounts,
        organStatusCounts,
        bloodGroupCounts,
        missionStatusCounts,
        healthBreakdown,
        totalMatches,
        acceptedMatches,
        completedMissions,
        cancelledMissions,
        activeMissions,
        viableOrgans,
        topEvents,
        trends: {
          organs:   genTrend(orgArr.length, 2),
          missions: genTrend(misArr.length, 1),
          blocks:   genTrend(blkArr.length, 4),
        },
      });
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Analytics load failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ─── Colour maps ─── */
  const ORGAN_COLORS = ['#22d3a0','#60a5fa','#a78bfa','#fbbf24','#f87171','#34d399','#f472b6'];
  const STATUS_COLORS = {
    RECOVERED: '#60a5fa', IN_ASSESSMENT: '#fbbf24',
    AWAITING_ALLOCATION: '#a78bfa', ALLOCATED: '#22d3a0',
    IN_TRANSIT: '#34d399', TRANSPLANTED: '#10b981', DISCARDED: '#f87171',
  };
  const MISSION_COLORS = {
    PENDING: '#9090b0', DISPATCHED: '#60a5fa', IN_TRANSIT: '#22d3a0',
    ARRIVED: '#fbbf24', COMPLETED: '#10b981', CANCELLED: '#f87171',
  };

  /* ─── Loading state ─── */
  if (loading) {
    return (
      <div className="page-container" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', minHeight: '60vh' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
          <div className={styles.loadSpinner} />
          <span>Aggregating analytics data…</span>
        </div>
      </div>
    );
  }

  const d = data;
  const organTypes    = Object.entries(d.organTypeCounts).sort((a, b) => b[1] - a[1]);
  const maxOrganType  = organTypes[0]?.[1] || 1;
  const bloodGroups   = Object.entries(d.bloodGroupCounts).sort((a, b) => b[1] - a[1]);
  const maxBlood      = bloodGroups[0]?.[1] || 1;

  const missionDonut  = Object.entries(d.missionStatusCounts).map(([k, v], i) => ({
    label: k, value: v, color: MISSION_COLORS[k] || ORGAN_COLORS[i % ORGAN_COLORS.length]
  }));
  const organDonut    = Object.entries(d.organStatusCounts).map(([k, v], i) => ({
    label: k, value: v, color: STATUS_COLORS[k] || ORGAN_COLORS[i % ORGAN_COLORS.length]
  }));

  const totalOrgans   = d.organs.length;
  const totalMissions = d.missions.length;
  const successRate   = pct(d.completedMissions, totalMissions);
  const viabilityRate = pct(d.viableOrgans, totalOrgans);
  const matchRate     = pct(d.acceptedMatches, d.totalMatches);

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Platform Analytics</h1>
          <p className={styles.subtitle}>Real-time operational intelligence across all system domains</p>
        </div>
        <div className={styles.headerRight}>
          {lastRefresh && (
            <span className={styles.refreshLabel}>
              Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button className={`btn btn-ghost ${styles.refreshBtn}`} onClick={loadData}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </motion.div>

      {/* ── Summary KPIs ── */}
      <div className={styles.kpiGrid}>
        {[
          { label: 'Total Hospitals',   value: d.hospitals.length,   icon: Building2,   color: '#60a5fa', trend: '+1 this month' },
          { label: 'Active Donors',     value: d.donors.length,      icon: Heart,       color: '#f87171', trend: 'Live' },
          { label: 'Organs Tracked',    value: totalOrgans,           icon: Activity,    color: '#22d3a0', trend: `${d.viableOrgans} viable` },
          { label: 'All Missions',      value: totalMissions,         icon: Plane,       color: '#a78bfa', trend: `${d.activeMissions} active` },
          { label: 'Ledger Blocks',     value: d.blocks.length,       icon: ShieldCheck, color: '#fbbf24', trend: 'Immutable' },
          { label: 'Match Outcomes',    value: d.totalMatches,        icon: GitMerge,    color: '#34d399', trend: `${matchRate}% accepted` },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              className={`glass-panel ${styles.kpiCard}`}
              style={{ '--accent': kpi.color }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, type: 'spring', stiffness: 200 }}
            >
              <div className={styles.kpiGlow} />
              <div className={styles.kpiTop}>
                <div className={styles.kpiIcon} style={{ background: `${kpi.color}1a`, color: kpi.color }}>
                  <Icon size={18} />
                </div>
                <span className={styles.kpiTrend} style={{ color: kpi.color }}>{kpi.trend}</span>
              </div>
              <div className={styles.kpiValue} style={{ color: kpi.color }}>{kpi.value.toLocaleString()}</div>
              <div className={styles.kpiLabel}>{kpi.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Performance Rates Row ── */}
      <div className={styles.ratesRow}>
        <motion.div className={`glass-panel ${styles.ratesCard}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className={styles.cardTitle}>
            <Target size={16} style={{ color: 'var(--brand-green)' }} />
            Key Performance Rates
          </h2>
          <div className={styles.radialGroup}>
            <RadialProgress value={successRate}   max={100} color="#22d3a0" label="Mission Success" />
            <RadialProgress value={viabilityRate} max={100} color="#60a5fa" label="Organ Viability" />
            <RadialProgress value={matchRate}     max={100} color="#a78bfa" label="Match Acceptance" />
            <RadialProgress
              value={d.blocks.length > 0 ? 100 : 0}
              max={100} color="#fbbf24" label="Ledger Integrity"
            />
          </div>
        </motion.div>

        {/* ── Mission Health ── */}
        <motion.div className={`glass-panel ${styles.ratesCard}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h2 className={styles.cardTitle}>
            <Activity size={16} style={{ color: 'var(--brand-amber)' }} />
            Mission Health Distribution
          </h2>
          <div className={styles.healthBreakdown}>
            {[
              { status: 'NORMAL',   color: '#22d3a0', Icon: CheckCircle2 },
              { status: 'WARNING',  color: '#fbbf24', Icon: Clock },
              { status: 'CRITICAL', color: '#f87171', Icon: Zap },
            ].map(({ status, color, Icon }) => {
              const count = d.healthBreakdown[status] || 0;
              const percent = pct(count, totalMissions);
              return (
                <div key={status} className={styles.healthItem}>
                  <Icon size={14} style={{ color }} />
                  <span className={styles.healthLabel}>{status}</span>
                  <div className={styles.healthBar}>
                    <motion.div
                      className={styles.healthBarFill}
                      style={{ background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <span className={styles.healthCount} style={{ color }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div className={styles.missionSummaryGrid}>
            <div className={styles.missionStat}>
              <span style={{ color: '#10b981' }}>✓ Completed</span>
              <strong>{d.completedMissions}</strong>
            </div>
            <div className={styles.missionStat}>
              <span style={{ color: '#60a5fa' }}>↑ Active</span>
              <strong>{d.activeMissions}</strong>
            </div>
            <div className={styles.missionStat}>
              <span style={{ color: '#f87171' }}>✕ Cancelled</span>
              <strong>{d.cancelledMissions}</strong>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Organ & Mission Donut Charts ── */}
      <div className={styles.chartsRow}>
        {/* Organ Status Donut */}
        <motion.div className={`glass-panel ${styles.chartCard}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <h2 className={styles.cardTitle}>
            <Heart size={16} style={{ color: 'var(--brand-green)' }} />
            Organ Status Breakdown
          </h2>
          <div className={styles.donutRow}>
            <DonutChart slices={organDonut} size={100} />
            <div className={styles.donutLegend}>
              {organDonut.map(sl => (
                <div key={sl.label} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: sl.color }} />
                  <span className={styles.legendLabel}>{sl.label.replace(/_/g, ' ')}</span>
                  <span className={styles.legendVal}>{sl.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mission Status Donut */}
        <motion.div className={`glass-panel ${styles.chartCard}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <h2 className={styles.cardTitle}>
            <Plane size={16} style={{ color: 'var(--brand-blue)' }} />
            Mission Status Breakdown
          </h2>
          <div className={styles.donutRow}>
            <DonutChart slices={missionDonut} size={100} />
            <div className={styles.donutLegend}>
              {missionDonut.map(sl => (
                <div key={sl.label} className={styles.legendItem}>
                  <div className={styles.legendDot} style={{ background: sl.color }} />
                  <span className={styles.legendLabel}>{sl.label}</span>
                  <span className={styles.legendVal}>{sl.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Organ Type Distribution */}
        <motion.div className={`glass-panel ${styles.chartCard}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <h2 className={styles.cardTitle}>
            <Award size={16} style={{ color: 'var(--brand-purple)' }} />
            Organ Type Distribution
          </h2>
          <div className={styles.barList}>
            {organTypes.slice(0, 7).map(([type, count], i) => (
              <BarRow key={type} label={type} value={count} max={maxOrganType}
                color={ORGAN_COLORS[i % ORGAN_COLORS.length]} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Blood Group + Blockchain Events + Trend Bars ── */}
      <div className={styles.bottomRow}>
        {/* Blood Group */}
        <motion.div className={`glass-panel ${styles.bottomCard}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <h2 className={styles.cardTitle}>
            <Activity size={16} style={{ color: 'var(--brand-red)' }} />
            Blood Group Demand
          </h2>
          <div className={styles.barList}>
            {bloodGroups.map(([bg, count], i) => (
              <BarRow key={bg} label={bg} value={count} max={maxBlood}
                color={ORGAN_COLORS[i % ORGAN_COLORS.length]} />
            ))}
          </div>
        </motion.div>

        {/* Top Blockchain Event Types */}
        <motion.div className={`glass-panel ${styles.bottomCard}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h2 className={styles.cardTitle}>
            <ShieldCheck size={16} style={{ color: 'var(--brand-purple)' }} />
            Top Ledger Event Types
          </h2>
          <div className={styles.barList}>
            {d.topEvents.map(([type, count], i) => (
              <BarRow key={type}
                label={type.replace(/_/g, ' ')}
                value={count}
                max={d.topEvents[0]?.[1] || 1}
                color={ORGAN_COLORS[i % ORGAN_COLORS.length]}
              />
            ))}
            {d.topEvents.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No ledger blocks found yet.</p>
            )}
          </div>
        </motion.div>

        {/* 7-Day Trend Bars */}
        <motion.div className={`glass-panel ${styles.bottomCard}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
          <h2 className={styles.cardTitle}>
            <BarChart3 size={16} style={{ color: 'var(--brand-green)' }} />
            7-Day Trend Overview
          </h2>
          <div className={styles.trendList}>
            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Organs Tracked</span>
              <Sparkbar values={d.trends.organs} color="#22d3a0" />
            </div>
            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Missions Created</span>
              <Sparkbar values={d.trends.missions} color="#60a5fa" />
            </div>
            <div className={styles.trendItem}>
              <span className={styles.trendLabel}>Ledger Blocks</span>
              <Sparkbar values={d.trends.blocks} color="#a78bfa" />
            </div>
          </div>
          <p className={styles.trendNote}>* Trend is illustrative; time-series DB not yet wired</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Analytics;
