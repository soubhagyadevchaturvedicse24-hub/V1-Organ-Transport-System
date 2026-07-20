import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMatches, updateMatchStatus } from '../services/api';
import { UserCheck, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import styles from './MatchingQueue.module.css';

const MatchingQueue = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getMatches()
      .then(setMatches)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAction = async (matchId, action) => {
    // Optimistic UI update for demo purposes
    setMatches(matches.filter(m => m._id !== matchId));
    try {
      await updateMatchStatus(matchId, action);
    } catch (e) {
      console.warn('Backend update failed, but optimistic update applied for demo', e);
    }
  };

  return (
    <div className="page-container">
      <div className={styles.header}>
        <h1 className="gradient-text">Matching Queue</h1>
        <p className={styles.subtitle}>Review AI-recommended allocations</p>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading recommendations...</div>
      ) : matches.length === 0 ? (
        <div className={styles.emptyState}>
          <UserCheck size={48} className={styles.emptyIcon} />
          <h3>No Pending Matches</h3>
          <p>All organs have been allocated or no new recommendations are available.</p>
        </div>
      ) : (
        <div className={styles.queueList}>
          <AnimatePresence>
            {matches.map((match) => {
              const isExpanded = expandedId === match._id;
              
              return (
                <motion.div 
                  key={match._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                  className={`${styles.matchCard} glass-panel`}
                >
                  <div className={styles.cardHeader} onClick={() => toggleExpand(match._id)}>
                    <div className={styles.matchScore}>
                      <div className={styles.scoreCircle} style={{ 
                        borderColor: match.score > 80 ? 'var(--status-normal)' : 'var(--status-warning)',
                        color: match.score > 80 ? 'var(--status-normal)' : 'var(--status-warning)'
                      }}>
                        {match.score}
                      </div>
                    </div>
                    
                    <div className={styles.matchDetails}>
                      <h3>Match Recommendation: {match._id}</h3>
                      <div className={styles.matchEntities}>
                        <span>Organ: <strong>{match.organId}</strong></span>
                        <span className={styles.separator}>→</span>
                        <span>Recipient: <strong>{match.recipientId}</strong></span>
                      </div>
                    </div>
                    
                    <div className={styles.expandToggle}>
                      {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={styles.expandedContent}
                      >
                        <div className={styles.compatibilitySection}>
                          <h4>Compatibility Matrix</h4>
                          <div className={styles.matrix}>
                            <div className={styles.matrixItem}>
                              <span>Blood Type</span>
                              {match.compatibility.bloodTypeMatch ? <Check className={styles.iconSuccess} size={16}/> : <X className={styles.iconDanger} size={16}/>}
                            </div>
                            <div className={styles.matrixItem}>
                              <span>HLA Match</span>
                              <span className={styles.textValue}>{match.compatibility.hlaMatchCount}/6</span>
                            </div>
                            <div className={styles.matrixItem}>
                              <span>Size Match</span>
                              {match.compatibility.sizeMatch ? <Check className={styles.iconSuccess} size={16}/> : <X className={styles.iconDanger} size={16}/>}
                            </div>
                          </div>
                        </div>

                        <div className={styles.reasoningSection}>
                          <h4>AI Reasoning</h4>
                          <ul className={styles.reasoningList}>
                            {match.reasoning.map((reason, idx) => (
                              <li key={idx}>{reason}</li>
                            ))}
                          </ul>
                        </div>

                        <div className={styles.actions}>
                          <button 
                            className={`${styles.btn} ${styles.btnDecline}`}
                            onClick={(e) => { e.stopPropagation(); handleAction(match._id, 'decline'); }}
                          >
                            <X size={18} /> Decline
                          </button>
                          <button 
                            className={`${styles.btn} ${styles.btnApprove}`}
                            onClick={(e) => { e.stopPropagation(); handleAction(match._id, 'accept'); }}
                          >
                            <Check size={18} /> Approve Allocation
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default MatchingQueue;
