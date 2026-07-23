import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Database, 
  RefreshCcw, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  Link as LinkIcon, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  PieChart as PieIcon,
  ExternalLink,
  Clock,
  Server
} from 'lucide-react';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getAllBlocks, verifyLedger, fetchArweaveData } from '../services/api';
import styles from './BlockchainAudit.module.css';

const getHumanReadableType = (type) => {
  if (!type) return 'System Event';
  const map = {
    'ORGAN_REGISTERED': '🫀 Organ Registered',
    'ORGAN_ASSESSMENT_STARTED': '🔬 Assessment Started',
    'ORGAN_VIABILITY_APPROVED': '✅ Viability Approved',
    'ORGAN_ALLOCATED': '📋 Organ Allocated',
    'ORGAN_DISPATCHED': '🚁 Organ Dispatched',
    'DONOR_CREATED': '👤 Donor Created',
    'DONOR_CONSENT_VERIFIED': '📝 Consent Verified',
    'matching.started': '🤝 Matching Started',
    'matching.match_found': '🎯 Match Found',
    'matching.accepted': '✅ Match Accepted',
    'MATCHING_TRIGGERED': '🤝 Matching Triggered',
    'MATCH_ACCEPTED': '✅ Match Accepted',
    'transport.created': '📦 Transport Created',
    'transport.dispatched': '🚁 Transport Dispatched',
    'transport.started': '🏃 Transit Started',
    'telemetry.received': '🟢 Normal Box Telemetry',
    'transport.telemetry_received': '🟢 Normal Box Telemetry',
    'TELEMETRY_RECEIVED': '🟢 Normal Box Telemetry',
    'telemetry.alert': '🚨 TELEMETRY ALERT',
    'transport.health_status_changed': '💓 Health Status Changed',
    'transport.arrived': '🏥 Transport Arrived',
    'transport.completed': '✅ Transport Completed',
    'TRANSPORT_CREATED': '📦 Transport Created',
    'TRANSPORT_DISPATCHED': '🚁 Transport Dispatched',
    'TRANSPORT_ARRIVED': '🏥 Transport Arrived',
    'TRANSPORT_COMPLETED': '✅ Transport Completed',
    'TELEMETRY_ALERT': '🚨 TELEMETRY ALERT',
    'HEALTH_STATUS_CHANGED': '💓 Health Status Changed',
  };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getBlockSeverity = (block) => {
  const eventType = (block.eventType || '').toLowerCase();
  const payload = block.payload || {};
  const telemetry = payload.telemetry || {};

  // 1. RED (Critical Tamper / Alert / Temp Anomaly)
  if (
    eventType.includes('alert') ||
    eventType.includes('tamper') ||
    telemetry.isTampered ||
    payload.isTampered ||
    (telemetry.temperature !== undefined && (telemetry.temperature > 8.0 || telemetry.temperature < 2.0)) ||
    (telemetry.batteryLevel !== undefined && telemetry.batteryLevel < 20)
  ) {
    return 'critical'; // RED
  }

  // 2. Distinct Lifecycle Milestones
  if (eventType.includes('created')) return 'milestone_created';     // Sky Blue
  if (eventType.includes('dispatched')) return 'milestone_dispatched'; // Emerald
  if (eventType.includes('arrived')) return 'milestone_arrived';       // Gold / Amber
  if (eventType.includes('completed')) return 'milestone_completed';   // Purple / Violet

  // 3. AMBER / YELLOW (Technical Warning / Health Change / Exception)
  if (
    eventType.includes('warning') ||
    eventType.includes('error') ||
    eventType.includes('changed') ||
    eventType.includes('retry') ||
    payload.status === 'WARNING' ||
    payload.health?.status === 'WARNING'
  ) {
    return 'warning'; // AMBER / YELLOW
  }

  // 4. GREEN (Normal Regular Operations)
  return 'normal'; // GREEN
};

/* ── Tooltip ── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.chartTooltip}>
      {label && <p className={styles.tooltipLabel}>{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className={styles.tooltipRow}>
          <span className={styles.tooltipDot} style={{ background: p.color || p.fill }} />
          <span className={styles.tooltipName}>{p.name}:</span>
          <span className={styles.tooltipVal}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

const BlockchainAudit = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [verifyState, setVerifyState] = useState({ loading: false, result: null });
  const [chainStatus, setChainStatus] = useState('Valid');

  const fetchBlocks = async () => {
    try {
      const data = await getAllBlocks();
      const rawList = Array.isArray(data) ? data : (data?.data || data?.blocks || []);
      const sorted = [...rawList].sort((a, b) => (b.blockIndex ?? 0) - (a.blockIndex ?? 0));
      setBlocks(sorted);
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    const interval = setInterval(fetchBlocks, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleVerify = async () => {
    setVerifyState({ loading: true, result: null });
    setChainStatus('Checking');
    try {
      const result = await verifyLedger();
      setVerifyState({ loading: false, result });
      setChainStatus(result.valid ? 'Valid' : 'Invalid');
    } catch (err) {
      setVerifyState({ loading: false, result: { valid: false, error: err.message || 'Verification failed' } });
      setChainStatus('Invalid');
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 6)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  };

  const filteredBlocks = blocks.filter(b => {
    if (filter === 'All') return true;
    const typeStr = `${b.entityType || ''} ${b.eventType || ''}`.toLowerCase();
    if (filter === 'Organ' && typeStr.includes('organ')) return true;
    if (filter === 'Donor' && typeStr.includes('donor')) return true;
    if (filter === 'Match' && typeStr.includes('match')) return true;
    if (filter === 'Transport' && (typeStr.includes('transport') || typeStr.includes('telemetry'))) return true;
    return false;
  });

  const lastBlockTime = blocks.length > 0 && blocks[0].timestamp
    ? formatDate(blocks[0].timestamp)
    : '--';

  /* ── Analytics: Event Type Pie ── */
  const EVENT_COLORS = ['#22d3a0','#60a5fa','#a78bfa','#fbbf24','#f472b6','#f87171','#34d399'];
  const eventTypePieData = useMemo(() => {
    const counts = {};
    blocks.forEach(b => {
      const t = b.entityType || b.eventType || 'Other';
      const label = t.length > 14 ? t.slice(0, 14) + '…' : t;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 6);
  }, [blocks]);

  /* ── Analytics: Block Growth Line ── */
  const blockGrowthData = useMemo(() => {
    const sorted = [...blocks].sort((a, b) => (a.blockIndex ?? 0) - (b.blockIndex ?? 0));
    const step = Math.max(1, Math.floor(sorted.length / 8));
    return sorted.filter((_, i) => i % step === 0 || i === sorted.length - 1).map(b => ({
      idx: `#${b.blockIndex}`,
      Blocks: (b.blockIndex ?? 0) + 1,
    }));
  }, [blocks]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <Activity size={20} className={styles.pulseIcon} />
          <span>Blockchain Audit Trail</span>
          <div className={styles.livePulse} title="Live feed active (2s auto-refresh)"></div>
        </div>

        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotNormal}`}></span> Normal
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotWarning}`}></span> Warning
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.dotCritical}`}></span> Tamper / Alert
          </span>
          <button 
            className={styles.refreshBtn}
            onClick={fetchBlocks}
            title="Manual Refresh"
          >
            <RefreshCcw size={14} className={loading ? styles.spinning : ''} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Database size={14} /> Total Blocks
          </div>
          <div className={styles.statValue}>{blocks.length}</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <ShieldCheck size={14} /> Chain Status
          </div>
          <div className={`${styles.statValue} ${chainStatus === 'Valid' ? styles.valid : chainStatus === 'Invalid' ? styles.invalid : ''}`}>
            {chainStatus === 'Valid' && <CheckCircle size={16} />}
            {chainStatus === 'Invalid' && <XCircle size={16} />}
            {chainStatus === 'Checking' && <Activity size={16} className={styles.spinning} />}
            <span>{chainStatus}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Clock size={14} /> Last Block
          </div>
          <div className={styles.statValueSmall}>
            {lastBlockTime}
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Server size={14} /> Network
          </div>
          <div className={styles.statValueSmall}>
            Hyperledger Fabric
          </div>
        </div>
      </div>

      {/* ── Analytics Charts Row ── */}
      {blocks.length > 0 && (
        <div className={styles.chartsRow}>
          {/* Event Type Pie */}
          <div className={`${styles.chartCard} glass-panel`}>
            <div className={styles.chartHead}>
              <PieIcon size={14} style={{ color: 'var(--brand-purple)' }} />
              <span className={styles.chartLabel}>Event Type Distribution</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={eventTypePieData} cx="40%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {eventTypePieData.map((_, i) => <Cell key={i} fill={EVENT_COLORS[i % EVENT_COLORS.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  layout="vertical" align="right" verticalAlign="middle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: '#9090b0', paddingLeft: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Block Growth Line */}
          <div className={`${styles.chartCard} glass-panel`}>
            <div className={styles.chartHead}>
              <BarChart2 size={14} style={{ color: 'var(--brand-green)' }} />
              <span className={styles.chartLabel}>Ledger Block Growth</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={blockGrowthData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="auditGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#22d3a0" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3a0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="idx" tick={{ fill: '#9090b0', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="Blocks" stroke="#22d3a0" strokeWidth={2.5} dot={{ r: 3, fill: '#22d3a0' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Controls & Filter Bar */}
      <div className={styles.controls}>
        <div className={styles.filters}>
          {['All', 'Organ', 'Donor', 'Match', 'Transport'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        
        <button 
          className={styles.verifyBtn} 
          onClick={handleVerify}
          disabled={verifyState.loading}
        >
          <ShieldCheck size={15} />
          <span>{verifyState.loading ? 'Verifying...' : 'Verify Chain'}</span>
        </button>
      </div>

      {verifyState.result && (
        <div className={`${styles.verifyResult} ${verifyState.result.valid ? styles.success : styles.error}`}>
          {verifyState.result.valid 
            ? <><CheckCircle size={16} /> Cryptographic verification passed. All {verifyState.result.totalBlocks || blocks.length} blocks are mathematically linked on Hyperledger Fabric.</>
            : <><XCircle size={16} /> Verification failed! {verifyState.result.error || 'Hash mismatch detected.'}</>
          }
        </div>
      )}

      {/* 3-Tier Color Coded Feed */}
      {loading && blocks.length === 0 ? (
        <div className={styles.emptyState}>Loading blockchain ledger...</div>
      ) : filteredBlocks.length === 0 ? (
        <div className={styles.emptyState}>No blocks found for filter "{filter}". Start the IoT simulator or trigger actions to generate blocks.</div>
      ) : (
        <div className={styles.feed}>
          <AnimatePresence>
            {filteredBlocks.map((block, i) => {
              const isExpanded = expandedBlock === block.blockIndex;
              const severity = getBlockSeverity(block); // 'critical' | 'warning' | 'normal'
              
              return (
                <motion.div 
                  key={block.blockIndex ?? block.hash ?? i}
                  className={styles.blockWrapper}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={`${styles.chainLink} ${styles[`link_${severity}`]}`}>
                    <LinkIcon size={12} />
                  </div>

                  <div 
                    className={`${styles.blockCard} ${styles[`card_${severity}`]} ${isExpanded ? styles.cardExpanded : ''}`}
                    onClick={() => setExpandedBlock(isExpanded ? null : block.blockIndex)}
                  >
                    <div className={styles.blockHeader}>
                      <div className={styles.blockLeft}>
                        <span className={`${styles.blockBadge} ${styles[`badge_${severity}`]}`}>
                          #{block.blockIndex}
                        </span>
                        <span className={styles.blockType}>
                          {severity === 'critical' && <AlertTriangle size={13} className={styles.alertIcon} />}
                          {getHumanReadableType(block.eventType)}
                        </span>
                        <span className={styles.blockEntity}>
                          {block.entityType} {block.entityId ? `[${block.entityId.substring(0, 10)}]` : ''}
                        </span>
                      </div>

                      <div className={styles.blockRight}>
                        <code className={`${styles.blockHash} ${styles[`hash_${severity}`]}`} title={block.hash}>
                          {truncateHash(block.hash)}
                        </code>
                        <span className={styles.blockTime}>
                          {formatDate(block.timestamp)}
                        </span>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className={styles.blockDetails} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Block Hash:</span>
                              <code className={styles.detailValue}>{block.hash || 'N/A'}</code>
                            </div>
                            <div className={styles.detailRow}>
                              <span className={styles.detailLabel}>Previous Hash:</span>
                              <code className={styles.detailValue}>{block.previousHash || 'Genesis Block'}</code>
                            </div>
                            {block.arweaveTxId && (
                              <div className={styles.detailRowColumn}>
                                <span className={styles.detailLabel}>Immutable Storage (Arweave Permaweb):</span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                  <a 
                                    href={`https://gateway.irys.xyz/${block.arweaveTxId}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={styles.arweaveLink}
                                  >
                                    🌐 Gateway: {block.arweaveTxId} <ExternalLink size={12} />
                                  </a>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const arData = await fetchArweaveData(block.arweaveTxId);
                                        alert(`Fetched directly from Arweave Permaweb:\n\n${JSON.stringify(arData, null, 2)}`);
                                      } catch (err) {
                                        alert(`Arweave Gateway notice: ${err.message}`);
                                      }
                                    }}
                                    style={{
                                      background: 'rgba(34, 211, 160, 0.15)',
                                      border: '1px solid rgba(34, 211, 160, 0.3)',
                                      color: '#22d3a0',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <ExternalLink size={10} /> Direct Fetch & Verify
                                  </button>
                                </div>
                              </div>
                            )}
                            {block.payload && (
                              <div className={styles.detailRowColumn}>
                                <span className={styles.detailLabel}>Payload Data:</span>
                                <pre className={styles.payload}>
                                  {JSON.stringify(block.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default BlockchainAudit;
