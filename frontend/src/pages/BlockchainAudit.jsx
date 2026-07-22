import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link as LinkIcon, 
  Clock, 
  Database, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Server,
  Activity
} from 'lucide-react';
import { getAllBlocks, verifyLedger } from '../services/api';
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
    'transport.arrived': '🏥 Transport Arrived',
    'transport.completed': '✅ Transport Completed',
    'TRANSPORT_CREATED': '📦 Transport Created',
    'TRANSPORT_DISPATCHED': '🚁 Transport Dispatched',
    'TRANSPORT_ARRIVED': '🏥 Transport Arrived',
    'TRANSPORT_COMPLETED': '✅ Transport Completed',
    'TELEMETRY_ALERT': '⚠️ Telemetry Alert',
    'HEALTH_STATUS_CHANGED': '💓 Health Status Changed',
  };
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const BlockchainAudit = () => {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [expandedBlock, setExpandedBlock] = useState(null);
  const [verifyState, setVerifyState] = useState({ loading: false, result: null });
  const [chainStatus, setChainStatus] = useState('Valid'); // Valid | Invalid | Checking
  
  const fetchBlocks = async () => {
    try {
      const data = await getAllBlocks();
      // Ensure we have an array
      const blockArray = Array.isArray(data) ? data : (data?.blocks || []);
      // Sort by index descending (newest first)
      const sorted = [...blockArray].sort((a, b) => (b.blockIndex || 0) - (a.blockIndex || 0));
      setBlocks(sorted);
    } catch (err) {
      console.error('Failed to fetch blocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchBlocks, 5000);
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
      setVerifyState({ 
        loading: false, 
        result: { valid: false, error: err.message || 'Verification failed' } 
      });
      setChainStatus('Invalid');
    }
  };

  const truncateHash = (hash) => {
    if (!hash) return 'N/A';
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      fractionalSecondDigits: 3
    }).format(d);
  };

  const filteredBlocks = blocks.filter(b => {
    if (filter === 'All') return true;
    const type = b.entityType?.toLowerCase() || '';
    if (filter === 'Organ' && type.includes('organ')) return true;
    if (filter === 'Donor' && type.includes('donor')) return true;
    if (filter === 'Match' && type.includes('match')) return true;
    if (filter === 'Transport' && type.includes('transport')) return true;
    return false;
  });

  const lastBlockTime = blocks.length > 0 && blocks[0].timestamp 
    ? formatDate(blocks[0].timestamp) 
    : '--';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Activity size={24} className={styles.pulseIcon} />
          Blockchain Audit Trail
          <div className={styles.livePulse} title="Live feed active"></div>
        </div>
      </div>

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Database size={16} /> Total Blocks
          </div>
          <div className={styles.statValue}>{blocks.length}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <ShieldCheck size={16} /> Chain Status
          </div>
          <div className={`${styles.statValue} ${chainStatus === 'Valid' ? styles.valid : chainStatus === 'Invalid' ? styles.invalid : ''}`}>
            {chainStatus === 'Valid' && <CheckCircle size={20} />}
            {chainStatus === 'Invalid' && <XCircle size={20} />}
            {chainStatus === 'Checking' && <Activity size={20} className={styles.spinning} />}
            {chainStatus}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Clock size={16} /> Last Block
          </div>
          <div className={styles.statValue} style={{ fontSize: '1rem' }}>
            {lastBlockTime}
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>
            <Server size={16} /> Network
          </div>
          <div className={styles.statValue} style={{ fontSize: '1rem' }}>
            Hyperledger Fabric
          </div>
        </div>
      </div>

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
        <div>
          <button 
            className={styles.verifyBtn} 
            onClick={handleVerify}
            disabled={verifyState.loading}
          >
            <ShieldCheck size={18} />
            {verifyState.loading ? 'Verifying...' : 'Verify Chain'}
          </button>
        </div>
      </div>

      {verifyState.result && (
        <div className={`${styles.verifyResult} ${verifyState.result.valid ? styles.success : styles.error}`}>
          {verifyState.result.valid 
            ? <><CheckCircle size={18} /> Cryptographic verification passed. All {verifyState.result.totalBlocks || blocks.length} blocks are mathematically linked.</>
            : <><XCircle size={18} /> Verification failed! {verifyState.result.error || 'Hash mismatch detected.'}</>
          }
        </div>
      )}

      {loading && blocks.length === 0 ? (
        <div className={styles.emptyState}>Loading blockchain data...</div>
      ) : filteredBlocks.length === 0 ? (
        <div className={styles.emptyState}>No blocks found for this filter.</div>
      ) : (
        <div className={styles.feed}>
          <AnimatePresence>
            {filteredBlocks.map((block, i) => {
              const isExpanded = expandedBlock === block.blockIndex;
              
              return (
                <motion.div 
                  key={block.blockIndex ?? block.hash ?? i}
                  className={styles.blockWrapper}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={styles.chainLink}>
                    <LinkIcon size={16} />
                  </div>
                  <div 
                    className={styles.blockCard}
                    onClick={() => setExpandedBlock(isExpanded ? null : block.blockIndex)}
                  >
                    <div className={styles.blockHeader}>
                      <div className={styles.blockLeft}>
                        <div className={styles.blockIndex}>#{block.blockIndex}</div>
                        <div>
                          <div className={styles.blockType}>
                            {getHumanReadableType(block.eventType)}
                          </div>
                          <div className={styles.blockEntity}>
                            {block.entityType} {block.entityId ? `- ${block.entityId.substring(0,8)}...` : ''}
                          </div>
                        </div>
                      </div>
                      <div className={styles.blockRight}>
                        <div className={styles.blockHash}>
                          {truncateHash(block.hash)}
                        </div>
                        <div className={styles.blockTime}>
                          {formatDate(block.timestamp)}
                        </div>
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div className={styles.blockDetails} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.detailRow}>
                              <div className={styles.detailLabel}>Block Hash</div>
                              <div className={styles.detailValue}>{block.hash || 'N/A'}</div>
                            </div>
                            <div className={styles.detailRow}>
                              <div className={styles.detailLabel}>Previous Hash</div>
                              <div className={styles.detailValue}>{block.previousHash || 'Genesis Block'}</div>
                            </div>
                            <div className={styles.detailRow}>
                              <div className={styles.detailLabel}>Transaction ID</div>
                              <div className={styles.detailValue}>{block.transactionId || 'N/A'}</div>
                            </div>
                            <div className={styles.detailRow}>
                              <div className={styles.detailLabel}>Payload Data</div>
                              <pre className={`${styles.detailValue} ${styles.payload}`}>
                                {block.payload ? JSON.stringify(block.payload, null, 2) : 'No payload data'}
                              </pre>
                            </div>
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
