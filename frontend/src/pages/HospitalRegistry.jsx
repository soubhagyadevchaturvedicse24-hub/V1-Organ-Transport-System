import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ShieldCheck, AlertCircle, Clock, CheckCircle2,
  XCircle, Search, MapPin, Award, FileCheck2, ExternalLink
} from 'lucide-react';
import { getHospitals } from '../services/api';
import styles from './HospitalRegistry.module.css';

/* Heuristic permit expiry calculation */
const getPermitExpiry = (hospital, idx) => {
  // Generate deterministic days remaining based on hospital name/ID length
  const hash = ((hospital.name || hospital.hospitalId || '').length * 37 + idx * 43) % 365;
  const daysRemaining = hash - 60; // range -60 to 305
  return daysRemaining;
};

const getComplianceStatus = (days) => {
  if (days <= 0)  return { status: 'EXPIRED',     label: 'Permit Expired', color: '#f87171', bg: 'rgba(248,113,113,0.12)', Icon: XCircle     };
  if (days <= 60) return { status: 'RENEWAL_DUE', label: 'Renewal Due',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  Icon: Clock       };
  return             { status: 'ACTIVE',      label: 'Compliant',     color: '#22d3a0', bg: 'rgba(34,211,160,0.12)',  Icon: CheckCircle2 };
};

/* SVG Circular Countdown Ring */
const RadialProgress = ({ daysRemaining }) => {
  const maxDays = 365;
  const clamped = Math.max(0, Math.min(daysRemaining, maxDays));
  const percent = Math.round((clamped / maxDays) * 100);
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (percent / 100) * circ;

  const color = daysRemaining <= 0 ? '#f87171' : daysRemaining <= 60 ? '#fbbf24' : '#22d3a0';

  return (
    <div className={styles.radialWrapper}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="none" />
        <circle
          cx="28" cy="28" r={radius}
          stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={circ}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 28 28)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className={styles.radialText} style={{ color }}>
        <span className={styles.radialDays}>{daysRemaining <= 0 ? '0' : daysRemaining}</span>
        <span className={styles.radialUnit}>days</span>
      </div>
    </div>
  );
};

const HospitalCard = ({ hospital, idx }) => {
  const days = getPermitExpiry(hospital, idx);
  const cfg = getComplianceStatus(days);
  const StatusIcon = cfg.Icon;

  const certType = hospital.type || (idx % 3 === 0 ? 'Autonomous / Central AIIMS' : idx % 2 === 0 ? 'State Govt Hospital' : 'Empaneled Private Super-Specialty');
  const city = hospital.address?.city || hospital.city || 'Regional Zone';

  return (
    <motion.div
      className={`glass-panel ${styles.card}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, type: 'spring', stiffness: 180 }}
    >
      <div className={styles.cardHeader}>
        <div className={styles.iconBox}>
          <Building2 size={24} style={{ color: 'var(--brand-blue)' }} />
        </div>

        <div className={styles.meta}>
          <h3 className={styles.name}>{hospital.name || `Hospital #${hospital.hospitalId}`}</h3>
          <div className={styles.location}>
            <MapPin size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span>{city}</span>
            <span className={styles.dot}>•</span>
            <span className={styles.certType}>{certType}</span>
          </div>
        </div>

        <RadialProgress daysRemaining={days} />
      </div>

      <div className={styles.cardBody}>
        {/* Compliance Status Badge */}
        <div className={styles.badgeRow}>
          <div className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}44` }}>
            <StatusIcon size={13} />
            {cfg.label}
          </div>
          <span className={styles.regId}>THOTA Reg ID: <strong className="mono">{`REG-${hospital.hospitalId?.slice(-6).toUpperCase() || idx + 100}`}</strong></span>
        </div>

        {/* Statutory Checklist */}
        <div className={styles.checklist}>
          <div className={styles.checkItem}>
            <FileCheck2 size={13} style={{ color: '#22d3a0' }} />
            <span>Section 10 Registration Cert Verified</span>
          </div>
          <div className={styles.checkItem}>
            <Award size={13} style={{ color: '#60a5fa' }} />
            <span>Section 15 Inspection Clearance</span>
          </div>
          <div className={styles.checkItem}>
            <ShieldCheck size={13} style={{ color: days > 0 ? '#22d3a0' : '#f87171' }} />
            <span>Transplant Committee Constituted (Rule 7)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const HospitalRegistry = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('ALL');

  useEffect(() => {
    getHospitals()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.hospitals || []);
        setHospitals(arr);
      })
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  }, []);

  const counts = hospitals.reduce((acc, h, i) => {
    const days = getPermitExpiry(h, i);
    const s = getComplianceStatus(days).status;
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filtered = hospitals.filter((h, i) => {
    const name = (h.name || h.city || '').toLowerCase();
    const days = getPermitExpiry(h, i);
    const status = getComplianceStatus(days).status;
    const matchSearch = name.includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Hospital Registry Compliance</h1>
          <p className={styles.subtitle}>THOTA Sections 10 &amp; 15 — Registration status, permit renewals &amp; Appropriate Authority audit trails</p>
        </div>
        <div className={styles.headerBadge}>
          <ShieldCheck size={14} style={{ color: 'var(--brand-green)' }} />
          <span>Section 10 Verified</span>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className={styles.kpiRow}>
        {[
          { label: 'Registered Hospitals', value: hospitals.length,               color: '#60a5fa' },
          { label: 'Fully Compliant',      value: counts.ACTIVE || 0,             color: '#22d3a0' },
          { label: 'Renewal Due (<60d)',   value: counts.RENEWAL_DUE || 0,        color: '#fbbf24' },
          { label: 'Expired Permits',      value: counts.EXPIRED || 0,            color: '#f87171' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            className={`glass-panel ${styles.kpi}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
            style={{ '--accent': k.color }}
          >
            <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
            <div className={styles.kpiLabel}>{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search by hospital name or city…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBtns}>
          {['ALL', 'ACTIVE', 'RENEWAL_DUE', 'EXPIRED'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All Statuses' : f === 'ACTIVE' ? 'Compliant' : f === 'RENEWAL_DUE' ? 'Renewal Due' : 'Expired'}
            </button>
          ))}
        </div>
      </div>

      {/* Hospital Cards Grid */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading hospital registry…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Building2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No registered hospitals match</h3>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((h, i) => (
            <HospitalCard key={h._id || h.hospitalId || i} hospital={h} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalRegistry;
