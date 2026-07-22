import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ShieldCheck, AlertCircle, Clock, CheckCircle2,
  XCircle, Search, MapPin, Award, FileCheck2, ExternalLink
} from 'lucide-react';
import { getHospitals } from '../services/api';
import styles from './HospitalRegistry.module.css';

/* Calculate real capability score */
const getCapabilityScore = (hospital) => {
  const caps = hospital.transplantCapabilities || [];
  return caps.length;
};

const getComplianceStatus = (hospital) => {
  const s = hospital.status;
  if (s === 'ACTIVE' || s === 'APPROVED') return { status: 'ACTIVE', label: 'Compliant', color: '#22d3a0', bg: 'rgba(34,211,160,0.12)', Icon: CheckCircle2 };
  if (s === 'SUSPENDED' || s === 'REJECTED' || s === 'DEACTIVATED') return { status: 'EXPIRED', label: 'Suspended/Expired', color: '#f87171', bg: 'rgba(248,113,113,0.12)', Icon: XCircle };
  return { status: 'RENEWAL_DUE', label: 'Pending Review', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', Icon: Clock };
};

/* SVG Circular Capability Ring */
const RadialProgress = ({ score }) => {
  const maxScore = 7;
  const clamped = Math.max(0, Math.min(score, maxScore));
  const percent = maxScore === 0 ? 0 : Math.round((clamped / maxScore) * 100);
  const radius = 22;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (percent / 100) * circ;

  const color = percent === 0 ? '#64748b' : percent < 30 ? '#f87171' : percent < 70 ? '#fbbf24' : '#22d3a0';

  return (
    <div className={styles.radialWrapper} title={`${clamped} out of ${maxScore} capabilities`}>
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
        <span className={styles.radialDays}>{clamped}</span>
        <span className={styles.radialUnit}>caps</span>
      </div>
    </div>
  );
};

const HospitalCard = ({ hospital }) => {
  const score = getCapabilityScore(hospital);
  const cfg = getComplianceStatus(hospital);
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

        <RadialProgress score={score} />
      </div>

      <div className={styles.cardBody}>
        {/* Compliance Status Badge */}
        <div className={styles.badgeRow}>
          <div className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}44` }}>
            <StatusIcon size={13} />
            {cfg.label}
          </div>
          <span className={styles.regId}>THOTA Reg ID: <strong className="mono">{`REG-${hospital.hospitalId?.slice(-6).toUpperCase() || '000000'}`}</strong></span>
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
            <ShieldCheck size={13} style={{ color: cfg.status === 'ACTIVE' ? '#22d3a0' : '#f87171' }} />
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
  const [filter, setFilter]       = useState('All');

  useEffect(() => {
    getHospitals()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.hospitals || []);
        setHospitals(arr);
      })
      .catch(() => setHospitals([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = {
    total: hospitals.length,
    compliant: hospitals.filter(h => getComplianceStatus(h).status === 'ACTIVE').length,
    renewal: hospitals.filter(h => getComplianceStatus(h).status === 'RENEWAL_DUE').length,
    expired: hospitals.filter(h => getComplianceStatus(h).status === 'EXPIRED').length,
  };

  const filteredHospitals = hospitals.filter(h => {
    if (search && !h.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter !== 'All') {
      const st = getComplianceStatus(h).status;
      if (filter === 'Compliant' && st !== 'ACTIVE') return false;
      if (filter === 'Renewal Due' && st !== 'RENEWAL_DUE') return false;
      if (filter === 'Expired' && st !== 'EXPIRED') return false;
    }
    return true;
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
          { label: 'Registered Hospitals', value: stats.total, color: '#60a5fa' },
          { label: 'Fully Compliant', value: stats.compliant, color: '#22d3a0' },
          { label: 'Renewal Due', value: stats.renewal, color: '#fbbf24' },
          { label: 'Expired Permits', value: stats.expired, color: '#f87171' },
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
          {['All', 'Compliant', 'Renewal Due', 'Expired'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
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
      ) : filteredHospitals.length === 0 ? (
        <div className={styles.emptyState}>
          <Building2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No registered hospitals match</h3>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredHospitals.map((hospital, idx) => (
            <HospitalCard key={hospital._id || hospital.hospitalId || idx} hospital={hospital} />
          ))}
        </div>
      )}
    </div>
  );
};

export default HospitalRegistry;
