import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, AlertTriangle, Link as LinkIcon, Database } from 'lucide-react';
import { getEntityHistory, verifyLedger } from '../services/api';
import styles from './BlockchainAudit.module.css';

const BlockchainAudit = () => {
  const [entityType, setEntityType] = useState('Organ');
  const [entityId, setEntityId] = useState('ORG-KID-001');
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getEntityHistory(entityType, entityId);
      // Sort by blockIndex to ensure chronological order
      data.sort((a, b) => a.blockIndex - b.blockIndex);
      setTimeline(data);
    } catch (e) {
      console.warn('Failed to fetch history', e);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyLedger();
      setVerification(result);
    } catch (e) {
      setVerification({ valid: false, error: 'Verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    // Initial demo fetch
    // If backend is not seeded, this will just show empty timeline.
    fetchHistory();
  }, []);

  return (
    <div className="page-container">
      <div className={styles.header}>
        <h1 className="gradient-text">Blockchain Audit</h1>
        <p className={styles.subtitle}>Cryptographically verify chain of custody</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.timelineSection}>
          <div className={`${styles.searchBox} glass-panel`}>
            <div className={styles.inputGroup}>
              <select 
                value={entityType} 
                onChange={e => setEntityType(e.target.value)}
                className={styles.select}
              >
                <option value="Donor">Donor</option>
                <option value="Organ">Organ</option>
                <option value="Match">Match</option>
                <option value="TransportMission">TransportMission</option>
              </select>
              <input 
                type="text" 
                value={entityId} 
                onChange={e => setEntityId(e.target.value)} 
                placeholder="Entity ID..."
                className={styles.input}
              />
            </div>
            <button className={styles.btnSearch} onClick={fetchHistory}>
              <Search size={18} /> Search Ledger
            </button>
          </div>

          <div className={styles.timelineContainer}>
            {loading ? (
              <div className={styles.loader}>Searching immutable ledger...</div>
            ) : timeline.length === 0 ? (
              <div className={styles.emptyState}>No blocks found for this entity.</div>
            ) : (
              <div className={styles.timeline}>
                <AnimatePresence>
                  {timeline.map((block, idx) => (
                    <motion.div 
                      key={block._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={styles.timelineItem}
                    >
                      <div className={styles.timelineLine}></div>
                      <div className={styles.timelineIcon}>
                        <LinkIcon size={16} />
                      </div>
                      <div className={`${styles.blockCard} glass-panel`}>
                        <div className={styles.blockHeader}>
                          <h4>{block.eventType}</h4>
                          <span className={styles.blockTime}>{new Date(block.timestamp).toLocaleString()}</span>
                        </div>
                        <div className={styles.blockData}>
                          <div className={styles.hashRow}>
                            <span className={styles.hashLabel}>Index:</span>
                            <span className={styles.hashValue}>#{block.blockIndex}</span>
                          </div>
                          <div className={styles.hashRow}>
                            <span className={styles.hashLabel}>Hash:</span>
                            <span className={styles.hashValue} title={block.hash}>
                              {block.hash.substring(0, 16)}...
                            </span>
                          </div>
                          <div className={styles.hashRow}>
                            <span className={styles.hashLabel}>Prev:</span>
                            <span className={styles.hashValue} title={block.previousHash}>
                              {block.previousHash.substring(0, 16)}...
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className={styles.verificationSection}>
          <div className={`${styles.verificationCard} glass-panel`}>
            <div className={styles.cardHeader}>
              <Database size={24} className={styles.iconPrimary} />
              <h3>Ledger Verification</h3>
            </div>
            
            <p className={styles.verificationDesc}>
              Re-calculates SHA-256 hashes for every block in the ledger starting from the Genesis block to detect tampering.
            </p>

            <button 
              className={styles.btnVerify} 
              onClick={handleVerify}
              disabled={verifying}
            >
              {verifying ? 'Verifying...' : 'Verify Cryptographic Integrity'}
            </button>

            {verification && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`${styles.verificationResult} ${verification.valid ? styles.valid : styles.invalid}`}
              >
                <div className={styles.resultHeader}>
                  {verification.valid ? (
                    <><ShieldCheck size={24} /> <span>Chain Status: VALID</span></>
                  ) : (
                    <><AlertTriangle size={24} /> <span>Chain Status: TAMPERED</span></>
                  )}
                </div>

                <div className={styles.resultStats}>
                  <div className={styles.statRow}>
                    <span>Blocks Verified:</span>
                    <strong>{verification.totalBlocks}</strong>
                  </div>
                  {!verification.valid && (
                    <div className={styles.statRowError}>
                      <span>Broken Block:</span>
                      <strong>#{verification.brokenBlock}</strong>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlockchainAudit;
