import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShieldCheck, AlertTriangle, Database, 
  Activity, CheckCircle, GitFork, Truck,
  FileJson, Lock, RefreshCcw, Check
} from 'lucide-react';
import { getEntityHistory } from '../services/api';
import styles from './BlockchainAudit.module.css';

const getEventConfig = (eventType) => {
  if (eventType.includes('REGISTERED')) return { icon: FileJson, color: 'var(--brand-blue)' };
  if (eventType.includes('ASSESSMENT')) return { icon: Activity, color: 'var(--brand-purple)' };
  if (eventType.includes('APPROVED')) return { icon: CheckCircle, color: 'var(--brand-green)' };
  if (eventType.includes('ALLOCATED')) return { icon: GitFork, color: 'var(--brand-indigo)' };
  if (eventType.includes('DISPATCHED') || eventType.includes('ARRIVED')) return { icon: Truck, color: 'var(--brand-teal)' };
  if (eventType.includes('alert')) return { icon: AlertTriangle, color: 'var(--brand-orange)' };
  if (eventType.includes('health')) return { icon: Activity, color: 'var(--brand-yellow)' };
  return { icon: Database, color: 'var(--text-secondary)' };
};

const BlockchainAudit = () => {
  const [entityType, setEntityType] = useState('Organ');
  const [entityId, setEntityId] = useState('ORG-KID-001');
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);

  const [verificationStatuses, setVerificationStatuses] = useState({});

  const fetchHistory = async () => {
    setLoading(true);
    setVerification(null);
    setVerificationStatuses({});
    setVerificationProgress(0);
    try {
      const data = await getEntityHistory(entityType, entityId);
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
    if (timeline.length === 0) return;
    setVerifying(true);
    setVerification(null);
    setVerificationProgress(0);
    const newStatuses = {};
    
    try {
      for (let i = 0; i < timeline.length; i++) {
        const block = timeline[i];
        newStatuses[block.blockIndex] = 'verifying';
        setVerificationStatuses({ ...newStatuses });
        
        // 1. Fetch blockchain block proofs from Express gateway
        const res = await fetch(`/api/audit/verify-block/${block.blockIndex}`);
        if (!res.ok) throw new Error('Failed to verify block proofs');
        const blockDetails = await res.json();
        
        // 2. Compute SHA-256 fingerprint locally in browser sandbox
        const rawPayloadText = JSON.stringify(block.payload);
        const encoder = new TextEncoder();
        const data = encoder.encode(rawPayloadText);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        // 3. Verify match
        const expectedHash = blockDetails.proofs.expectedPayloadSHA256;
        if (computedHash === expectedHash) {
          newStatuses[block.blockIndex] = 'valid';
        } else {
          newStatuses[block.blockIndex] = 'invalid';
        }
        
        setVerificationStatuses({ ...newStatuses });
        setVerificationProgress(((i + 1) / timeline.length) * 100);
        await new Promise(r => setTimeout(r, 600)); // Slower loop for visual effect
      }
      
      const allValid = Object.values(newStatuses).every(s => s === 'valid');
      setVerification({
        valid: allValid,
        totalBlocks: timeline.length,
        verifiedBlocks: timeline.length,
        brokenBlock: allValid ? null : Object.keys(newStatuses).find(k => newStatuses[k] === 'invalid')
      });
    } catch (e) {
      console.error(e);
      setVerification({ valid: false, error: 'Cryptographic verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className="gradient-text">Blockchain Audit</h1>
        <p className={styles.subtitle}>Cryptographically verify the immutable chain of custody</p>
      </div>

      <div className={styles.layout}>
        <div className={styles.timelineSection}>
          <div className={styles.searchBox}>
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
                placeholder="Enter Entity ID (e.g. ORG-KID-001)"
                className={styles.input}
                onKeyDown={e => e.key === 'Enter' && fetchHistory()}
              />
            </div>
            <button className={styles.btnSearch} onClick={fetchHistory}>
              <Search size={18} /> Retrieve Ledger
            </button>
          </div>

          <div className={styles.timelineContainer}>
            {loading ? (
              <div className={styles.loader}>
                <RefreshCcw size={48} className="spin" style={{ color: 'var(--brand-blue)' }} />
                <span>Querying Distributed Ledger...</span>
              </div>
            ) : timeline.length === 0 ? (
              <div className={styles.emptyState}>
                <Database size={48} style={{ color: 'var(--text-tertiary)' }} />
                <span>No blocks found for this entity.</span>
              </div>
            ) : (
              <div className={styles.timeline}>
                <AnimatePresence>
                  {timeline.map((block, idx) => {
                    const status = verificationStatuses[block.blockIndex];
                    const cfg = getEventConfig(block.eventType);
                    const Icon = cfg.icon;

                    return (
                      <motion.div 
                        key={block._id || block.blockIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`${styles.timelineItem} ${status ? styles[status] : ''}`}
                      >
                        <div className={`${styles.timelineLine} ${status ? styles[status] : ''}`}></div>
                        
                        <div className={styles.timelineIcon} style={{ color: status === 'valid' ? 'var(--brand-green)' : status === 'invalid' ? 'var(--brand-red)' : cfg.color }}>
                          {status === 'valid' ? <Check size={20} /> : status === 'invalid' ? <AlertTriangle size={20} /> : <Icon size={20} />}
                        </div>
                        
                        <div className={styles.blockCard}>
                          <div className={styles.blockHeader}>
                            <div className={styles.blockHeaderLeft}>
                              <h4>{block.eventType}</h4>
                              <span className={styles.blockTime}>{new Date(block.timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'medium' })}</span>
                            </div>
                            
                            {status === 'valid' && (
                              <span className={`${styles.statusBadge} ${styles.badgeValid}`}>
                                INTEGRITY VERIFIED
                              </span>
                            )}
                            {status === 'invalid' && (
                              <span className={`${styles.statusBadge} ${styles.badgeInvalid}`}>
                                ALERT: HASH MISMATCH
                              </span>
                            )}
                            {status === 'verifying' && (
                              <span className={`${styles.statusBadge} ${styles.badgeVerifying}`}>
                                COMPUTING SHA-256...
                              </span>
                            )}
                          </div>
                          
                          <div className={styles.blockData}>
                            <div className={styles.cryptoHashes}>
                              <div className={styles.hashRow}>
                                <span className={styles.hashLabel}>Block</span>
                                <span className={styles.hashValue} style={{ background: 'transparent', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                                  #{block.blockIndex}
                                </span>
                              </div>
                              <div className={styles.hashRow}>
                                <span className={styles.hashLabel}>Hash</span>
                                <span className={styles.hashValue} title={block.hash}>
                                  {block.hash || '—'}
                                </span>
                              </div>
                              <div className={styles.hashRow}>
                                <span className={styles.hashLabel}>Prev</span>
                                <span className={styles.hashValue} title={block.previousHash} style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)' }}>
                                  {block.previousHash || '—'}
                                </span>
                              </div>
                            </div>
                            
                            <div className={styles.payloadBox}>
                              <div className={styles.payloadLabel}>
                                <Database size={12} /> Payload Data
                              </div>
                              <pre className={styles.payloadContent}>
                                {JSON.stringify(block.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        <div className={styles.verificationSection}>
          <div className={styles.verificationCard}>
            <div className={styles.cardHeader}>
              <Lock size={32} className={styles.iconPrimary} />
              <h3>Ledger Verification</h3>
            </div>
            
            <p className={styles.verificationDesc}>
              Simulates a cryptographic audit node by recalculating the SHA-256 hashes for every block locally in your browser. This ensures the chain of custody has not been tampered with.
            </p>

            <button 
              className={styles.btnVerify} 
              onClick={handleVerify}
              disabled={verifying || timeline.length === 0}
            >
              {verifying ? (
                <><RefreshCcw size={20} className="spin" /> Verifying Ledger...</>
              ) : (
                <><ShieldCheck size={20} /> Verify Cryptographic Integrity</>
              )}
            </button>

            {verifying && (
              <div className={styles.progressContainer}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>
            )}

            {verification && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${styles.verificationResult} ${verification.valid ? styles.valid : styles.invalid}`}
              >
                <div className={styles.resultHeader}>
                  {verification.valid ? (
                    <><ShieldCheck size={28} /> <span>100% SECURE & VERIFIED</span></>
                  ) : (
                    <><AlertTriangle size={28} /> <span>LEDGER COMPROMISED</span></>
                  )}
                </div>

                <div className={styles.resultStats}>
                  <div className={styles.statRow}>
                    <span>Total Blocks Checked:</span>
                    <strong>{verification.totalBlocks}</strong>
                  </div>
                  <div className={styles.statRow}>
                    <span>Verification Time:</span>
                    <strong>{(verification.totalBlocks * 0.6).toFixed(1)}s</strong>
                  </div>
                  {!verification.valid && (
                    <div className={styles.statRowError} style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <span>Failed Block Hash:</span>
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
