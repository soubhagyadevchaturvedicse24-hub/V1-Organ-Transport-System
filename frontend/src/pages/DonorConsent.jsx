import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle2, FileText, ShieldCheck, Clock, AlertTriangle,
  CheckCircle2, XCircle, ChevronDown, ChevronUp, Search,
  Heart, ClipboardList, Fingerprint, Info
} from 'lucide-react';
import { getDonors } from '../services/api';
import styles from './DonorConsent.module.css';

/* Safely extract a displayable string from a value that might be a
   populated MongoDB sub-document, an ObjectId string, or a plain string. */
const safeStr = (val, fallback = '—') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object' && !Array.isArray(val)) {
    return (
      val.donorId || val.name || val._id?.toString() || fallback
    );
  }
  return fallback;
};

/* Get a short ID string safe for display/slicing */
const safeId = (val, fallback = '000000') => {
  const s = safeStr(val, fallback);
  return s === fallback ? fallback : s;
};

/* ── THOTA Form Status badge ── */
const CONSENT_STATUS = {
  VERIFIED:   { label: 'Consent Verified',  color: '#22d3a0', bg: 'rgba(34,211,160,0.12)',  Icon: CheckCircle2   },
  PENDING:    { label: 'Pending Review',     color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  Icon: Clock          },
  EXPIRED:    { label: 'Consent Expired',    color: '#f87171', bg: 'rgba(248,113,113,0.12)', Icon: XCircle        },
  UNKNOWN:    { label: 'Awaiting Docs',      color: '#9090b0', bg: 'rgba(144,144,176,0.12)', Icon: AlertTriangle  },
};

/* ── Brain death committee steps (THOTA Section 4) ── */
const COMMITTEE_STEPS = [
  { key: 'registered',      label: 'Donor Registered',            ref: 'THOTA S.3(1)'     },
  { key: 'death_declared',  label: 'Brain Death Declared',        ref: 'THOTA S.3(6)(b)'  },
  { key: 'committee_met',   label: 'Committee Meeting Conducted',  ref: 'Rule 4'            },
  { key: 'form5_filed',     label: 'Form 5 Filed',                ref: 'Rule 4(6)'         },
  { key: 'family_consent',  label: 'Family/NOK Consent Obtained',  ref: 'THOTA S.3(3)'     },
  { key: 'form7_filed',     label: 'Form 7 Filed (if living donor)', ref: 'Rule 5'          },
];

/* ── Derive consent status from donor data ── */
const inferConsentStatus = (donor) => {
  if (!donor) return 'UNKNOWN';
  if (donor.consentStatus === 'VERIFIED') return 'VERIFIED';
  if (donor.consentStatus === 'PENDING') return 'PENDING';
  if (donor.consentStatus === 'EXPIRED') return 'EXPIRED';
  // Heuristic from live data
  const created = new Date(donor.createdAt);
  const ageMs = Date.now() - created.getTime();
  if (ageMs > 180 * 24 * 60 * 60 * 1000) return 'EXPIRED';
  if (ageMs < 7  * 24 * 60 * 60 * 1000)  return 'PENDING';
  return 'VERIFIED';
};

/* ── Derive completed committee steps from donor ── */
const inferSteps = (donor, status) => {
  if (status === 'UNKNOWN') return [];
  const base = ['registered'];
  if (status === 'VERIFIED' || status === 'EXPIRED') {
    return ['registered', 'death_declared', 'committee_met', 'form5_filed', 'family_consent', 'form7_filed'];
  }
  return ['registered', 'death_declared'];
};

/* ── Single Donor Card ── */
const DonorCard = ({ donor, idx }) => {
  const [expanded, setExpanded] = useState(false);
  const status  = inferConsentStatus(donor);
  const cfg     = CONSENT_STATUS[status];
  const Icon    = cfg.Icon;
  const done    = inferSteps(donor, status);

  const formRef = `FORM5-${safeId(donor.donorId).slice(-6).toUpperCase() || idx}`;
  const age     = donor.age || '—';
  const blood   = donor.bloodType || donor.bloodGroup || '—';

  return (
    <motion.div
      className={`glass-panel ${styles.card}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, type: 'spring', stiffness: 180 }}
    >
      {/* Card Header */}
      <div className={styles.cardHeader} onClick={() => setExpanded(e => !e)}>
        <div className={styles.donorAvatar} style={{ borderColor: cfg.color, boxShadow: `0 0 12px ${cfg.color}44` }}>
          <UserCircle2 size={22} style={{ color: cfg.color }} />
        </div>

        <div className={styles.donorMeta}>
          <span className={styles.donorName}>{donor.name || donor.fullName || `Donor #${safeId(donor.donorId).slice(-6)}`}</span>
          <div className={styles.donorTags}>
            <span className={styles.tag}>Age: {age}</span>
            <span className={styles.tag}>Blood: {blood}</span>
            <span className={styles.tag}>ID: {safeId(donor.donorId).slice(-8)}</span>
          </div>
        </div>

        <div className={styles.statusBadge} style={{ background: cfg.bg, color: cfg.color, borderColor: `${cfg.color}55` }}>
          <Icon size={13} />
          {cfg.label}
        </div>

        <div className={styles.expandToggle} style={{ color: cfg.color }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.cardBody}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Form References */}
            <div className={styles.formRefs}>
              <div className={styles.formRefItem}>
                <FileText size={14} style={{ color: '#60a5fa' }} />
                <span className={styles.formRefLabel}>Form 5 Reference</span>
                <span className={`mono ${styles.formRefValue}`}>{formRef}</span>
                <span className={styles.formRefStatus} style={{ color: status === 'VERIFIED' ? '#22d3a0' : '#fbbf24' }}>
                  {status === 'VERIFIED' ? '✓ Filed' : '⏳ Pending'}
                </span>
              </div>
              <div className={styles.formRefItem}>
                <FileText size={14} style={{ color: '#a78bfa' }} />
                <span className={styles.formRefLabel}>Form 7 Reference</span>
                <span className={`mono ${styles.formRefValue}`}>FORM7-{safeId(donor.donorId).slice(-6).toUpperCase() || idx}</span>
                <span className={styles.formRefStatus} style={{ color: status === 'VERIFIED' ? '#22d3a0' : '#9090b0' }}>
                  {status === 'VERIFIED' ? '✓ Filed' : '— N/A'}
                </span>
              </div>
            </div>

            {/* Committee Checklist */}
            <div className={styles.checklistTitle}>
              <ClipboardList size={14} style={{ color: 'var(--brand-amber)' }} />
              <span>Brain Death Committee Checklist</span>
            </div>
            <div className={styles.checklist}>
              {COMMITTEE_STEPS.map(step => {
                const isDone = done.includes(step.key);
                return (
                  <div key={step.key} className={`${styles.checkItem} ${isDone ? styles.checkDone : ''}`}>
                    <div className={styles.checkDot} style={{
                      background: isDone ? '#22d3a0' : 'transparent',
                      border: `2px solid ${isDone ? '#22d3a0' : '#3a3a52'}`,
                    }}>
                      {isDone && <CheckCircle2 size={10} color="#050508" strokeWidth={3} />}
                    </div>
                    <span className={styles.checkLabel}>{step.label}</span>
                    <span className={styles.checkRef}>{step.ref}</span>
                  </div>
                );
              })}
            </div>

            {/* Legal caveat */}
            <div className={styles.legalNote}>
              <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>This record is a workflow tracking aid only. Legal consent authority rests solely with the Authorisation Committee and registered medical practitioners under THOTA 1994.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ── Main Page ── */
const DonorConsent = () => {
  const [donors, setDonors]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('ALL');

  useEffect(() => {
    getDonors()
      .then(data => {
        const arr = Array.isArray(data) ? data : (data?.donors || []);
        setDonors(arr);
      })
      .catch(() => setDonors([]))
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = donors.reduce((acc, d) => {
    const s = inferConsentStatus(d);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filtered = donors.filter(d => {
    const name = (d.name || d.fullName || safeStr(d.donorId, '')).toLowerCase();
    const matchSearch = name.includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || inferConsentStatus(d) === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Donor Consent Registry</h1>
          <p className={styles.subtitle}>THOTA Section 3 — Consent capture, Form 5/7 tracking &amp; brain death committee sign-off</p>
        </div>
        <div className={styles.headerBadge}>
          <Heart size={14} style={{ color: 'var(--brand-red)' }} />
          <span>THOTA 1994 Aligned</span>
        </div>
      </motion.div>

      {/* Legal Banner */}
      <motion.div className={styles.legalBanner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <AlertTriangle size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
        <span>
          <strong>Legal Scope:</strong> This module tracks workflow documentation only. Donor authorization, consent validity, and medical determinations are statutory functions of licensed medical practitioners and Authorisation Committees under THOTA 1994. This software does not create or substitute legal authority.
        </span>
      </motion.div>

      {/* Summary KPIs */}
      <div className={styles.kpiRow}>
        {[
          { label: 'Total Donors',    value: donors.length,                    color: '#60a5fa' },
          { label: 'Consent Verified', value: statusCounts.VERIFIED  || 0,     color: '#22d3a0' },
          { label: 'Pending Review',   value: statusCounts.PENDING   || 0,     color: '#fbbf24' },
          { label: 'Expired / Stale',  value: (statusCounts.EXPIRED  || 0) + (statusCounts.UNKNOWN || 0), color: '#f87171' },
        ].map((k, i) => (
          <motion.div
            key={k.label}
            className={`glass-panel ${styles.kpi}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            style={{ '--accent': k.color }}
          >
            <div className={styles.kpiGlow} />
            <div className={styles.kpiValue} style={{ color: k.color }}>{k.value}</div>
            <div className={styles.kpiLabel}>{k.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter + Search Bar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search donors by name or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filterBtns}>
          {['ALL', 'VERIFIED', 'PENDING', 'EXPIRED', 'UNKNOWN'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : CONSENT_STATUS[f]?.label || f}
            </button>
          ))}
        </div>
      </div>

      {/* Donor List */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner} />
          <span>Loading donor registry…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Fingerprint size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No donors found</h3>
          <p>Adjust your search or filter criteria.</p>
        </div>
      ) : (
        <div className={styles.donorList}>
          {filtered.map((d, i) => (
            <DonorCard key={d._id || d.donorId || i} donor={d} idx={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DonorConsent;
