import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Scale, FileText, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, ShieldCheck, Link2, AlertTriangle, Info,
  Check, X
} from 'lucide-react';
import { getMatches } from '../services/api';
import styles from './CommitteeApproval.module.css';

/* Simulated Committee Vetting Applications derived from matches/donors */
const RULE6_CHECKLIST = [
  { key: 'joint_app',      label: 'Joint Application Submitted (Form 10/11)', ref: 'Rule 6(1)' },
  { key: 'identity_proof', label: 'Biometric Identity & Relationship Proof',   ref: 'Rule 6(2)' },
  { key: 'eval_report',    label: 'Medical Assessment & Psychiatric Eval',    ref: 'Rule 6(3)' },
  { key: 'no_coercion',    label: 'No-Coercion / Non-Commercial Affidavit',     ref: 'THOTA S.9(4)' },
  { key: 'video_recorded', label: 'Committee Interview Audio-Video Recorded', ref: 'Rule 6(5)' },
];

const CommitteeCard = ({ app, idx, onDecision }) => {
  const [expanded, setExpanded] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [committing, setCommitting] = useState(false);

  const status = app.status || 'UNDER_REVIEW';
  const statusColor = status === 'APPROVED' ? '#22d3a0' : status === 'REJECTED' ? '#f87171' : '#fbbf24';

  const handleAction = (verdict) => {
    setCommitting(true);
    setTimeout(() => {
      onDecision(app.id, verdict, decisionNotes);
      setCommitting(false);
    }, 600);
  };

  return (
    <motion.div
      className={`glass-panel ${styles.card}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, type: 'spring', stiffness: 180 }}
    >
      <div className={styles.cardHeader} onClick={() => setExpanded(e => !e)}>
        <div className={styles.avatarBox} style={{ borderColor: statusColor }}>
          <Users size={20} style={{ color: statusColor }} />
        </div>

        <div className={styles.meta}>
          <div className={styles.titleRow}>
            <h3 className={styles.appTitle}>Case #{app.id} — {app.organType || 'Kidney'} Living Donation</h3>
            <span className={styles.donorTypeTag}>{app.relationship || 'Near Relative (THOTA S.9(1))'}</span>
          </div>
          <div className={styles.subMeta}>
            <span>Donor: <strong>{app.donorName}</strong></span>
            <span className={styles.sep}>→</span>
            <span>Recipient: <strong>{app.recipientName}</strong></span>
            <span className={styles.sep}>•</span>
            <span>Hospital: {app.hospital}</span>
          </div>
        </div>

        <div className={styles.statusBadge} style={{ background: `${statusColor}18`, color: statusColor, borderColor: `${statusColor}44` }}>
          {status === 'APPROVED' ? <CheckCircle2 size={13} /> : status === 'REJECTED' ? <XCircle size={13} /> : <Clock size={13} />}
          {status.replace('_', ' ')}
        </div>

        <div className={styles.expandToggle} style={{ color: statusColor }}>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            className={styles.cardBody}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            {/* Rule 6 Checklist */}
            <div className={styles.checklistTitle}>
              <Scale size={14} style={{ color: 'var(--brand-purple)' }} />
              <span>THOTA Rule 6 Joint Application Vetting Checklist</span>
            </div>

            <div className={styles.checklist}>
              {RULE6_CHECKLIST.map((step) => (
                <div key={step.key} className={styles.checkItem}>
                  <CheckCircle2 size={13} style={{ color: '#22d3a0' }} />
                  <span className={styles.checkLabel}>{step.label}</span>
                  <span className={styles.checkRef}>{step.ref}</span>
                </div>
              ))}
            </div>

            {/* Decision & Blockchain Commit Area */}
            {status === 'UNDER_REVIEW' && (
              <div className={styles.actionBox}>
                <label className={styles.inputLabel}>Committee Meeting Minutes &amp; Statutory Justification:</label>
                <textarea
                  className={styles.notesInput}
                  placeholder="Enter committee resolution summary, reference numbers, and chairperson approval notes…"
                  value={decisionNotes}
                  onChange={e => setDecisionNotes(e.target.value)}
                  rows={2}
                />

                <div className={styles.btnRow}>
                  <button
                    className={`${styles.btn} ${styles.btnDecline}`}
                    onClick={(e) => { e.stopPropagation(); handleAction('REJECTED'); }}
                    disabled={committing}
                  >
                    <X size={15} /> Reject Application
                  </button>

                  <button
                    className={`${styles.btn} ${styles.btnApprove}`}
                    onClick={(e) => { e.stopPropagation(); handleAction('APPROVED'); }}
                    disabled={committing}
                  >
                    {committing ? (
                      <>
                        <div className={styles.btnSpinner} />
                        Committing to Ledger…
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} /> Approve &amp; Commit to Ledger
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Completed Decision Metadata */}
            {status !== 'UNDER_REVIEW' && (
              <div className={styles.completedBox} style={{ borderColor: `${statusColor}44` }}>
                <div className={styles.completedHeader}>
                  <Link2 size={14} style={{ color: 'var(--brand-purple)' }} />
                  <span>Blockchain Ledger Audit Proof</span>
                  <span className={`mono ${styles.blockHash}`}>TxHash: 0x{Math.random().toString(16).slice(2, 12)}...</span>
                </div>
                <p className={styles.completedNotes}>
                  <strong>Minutes:</strong> {app.notes || 'Application vetted under THOTA Section 9(3). Formal clearance issued by Authorisation Committee.'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CommitteeApproval = () => {
  const [applications, setApplications] = useState([
    {
      id: 'APP-8091',
      organType: 'Kidney',
      donorName: 'Ramesh Kumar (Father)',
      recipientName: 'Amit Kumar (Son)',
      hospital: 'AIIMS New Delhi',
      relationship: 'Near Relative (S.9(1))',
      status: 'UNDER_REVIEW',
    },
    {
      id: 'APP-8092',
      organType: 'Liver (Segment)',
      donorName: 'Priya Sharma (Spouse)',
      recipientName: 'Vikram Sharma (Spouse)',
      hospital: 'Apollo Hospital Chennai',
      relationship: 'Spouse (S.9(1))',
      status: 'UNDER_REVIEW',
    },
    {
      id: 'APP-8044',
      organType: 'Kidney',
      donorName: 'Sunita Devi (Mother)',
      recipientName: 'Neha Devi (Daughter)',
      hospital: 'PGIMER Chandigarh',
      relationship: 'Near Relative (S.9(1))',
      status: 'APPROVED',
      notes: 'Form 10 verified. All medical clearances passed under Section 9(1). Approved unanimously.',
    },
  ]);
  const [filter, setFilter] = useState('ALL');

  const handleDecision = (appId, verdict, notes) => {
    setApplications(prev => prev.map(a => {
      if (a.id === appId) {
        return { ...a, status: verdict, notes: notes || 'Committee clearance logged to ledger.' };
      }
      return a;
    }));
  };

  const filtered = applications.filter(a => filter === 'ALL' || a.status === filter);

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Authorisation Committee Approval</h1>
          <p className={styles.subtitle}>THOTA Section 9 &amp; Rule 6 — Living donor joint-application vetting &amp; statutory approval workflow</p>
        </div>
        <div className={styles.headerBadge}>
          <Scale size={14} style={{ color: 'var(--brand-purple)' }} />
          <span>Statutory Authority Layer</span>
        </div>
      </motion.div>

      {/* Statutory Scope Banner */}
      <motion.div className={styles.legalBanner} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Info size={16} style={{ color: '#a78bfa', flexShrink: 0 }} />
        <span>
          <strong>THOTA Section 9 Mandate:</strong> The Authorisation Committee is the sole statutory body empowered to vet living organ donation applications. This interface logs vetting checklists, meeting minutes, and decision envelopes, which are immutably signed to the permissioned blockchain audit trail.
        </span>
      </motion.div>

      {/* Toolbar / Filters */}
      <div className={styles.toolbar}>
        <div className={styles.filterBtns}>
          {['ALL', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All Cases' : f === 'UNDER_REVIEW' ? 'Pending Vetting' : f === 'APPROVED' ? 'Approved' : 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* Applications List */}
      <div className={styles.appList}>
        {filtered.map((app, i) => (
          <CommitteeCard key={app.id} app={app} idx={i} onDecision={handleDecision} />
        ))}
      </div>
    </div>
  );
};

export default CommitteeApproval;
