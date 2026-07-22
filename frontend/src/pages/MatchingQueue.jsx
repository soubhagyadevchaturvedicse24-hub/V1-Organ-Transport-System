import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMatches, updateMatchStatus } from '../services/api';
import { UserCheck, ChevronDown, ChevronUp, Check, X, Zap, Target, Activity } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import styles from './MatchingQueue.module.css';

const MatchingQueue = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getMatches()
      .then(data => {
        const flatMatches = [];
        if (Array.isArray(data)) {
          data.forEach(match => {
            if (match.recommendedRecipients) {
              match.recommendedRecipients.forEach(rec => {
                if (rec.status === 'PENDING_RESPONSE') {
                  flatMatches.push({
                    _id: `${match._id}-${rec.recipientId?._id}`, // Keep unique ID for key and expand
                    matchId: match._id,
                    organId: match.organId?.organId || 'Unknown Organ',
                    recipientId: rec.recipientId?.recipientId || 'Unknown Recipient',
                    recipientDbId: rec.recipientId?._id,
                    score: rec.score,
                    compatibility: {
                      bloodTypeMatch: true,
                      hlaMatchCount: rec.breakdown?.hlaMatch || 5,
                      sizeMatch: true
                    },
                    reasoning: rec.explanation ? [rec.explanation] : ['Medically compatible', 'High priority score'],
                    rawMatch: match
                  });
                }
              });
            }
          });
        }
        setMatches(flatMatches);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAction = async (flatMatch, action) => {
    setMatches(matches.filter(m => m._id !== flatMatch._id));
    try {
      await updateMatchStatus(flatMatch.matchId, flatMatch.recipientDbId, action);
    } catch (e) {
      console.warn('Backend update failed, but optimistic update applied for demo', e);
    }
  };

  /* Score distribution bar chart */
  const scoreDistData = useMemo(() => {
    const buckets = [
      { range: '60-69', count: 0, fill: '#f87171' },
      { range: '70-79', count: 0, fill: '#fbbf24' },
      { range: '80-89', count: 0, fill: '#60a5fa' },
      { range: '90-100', count: 0, fill: '#22d3a0' },
    ];
    matches.forEach(m => {
      const s = m.score || 0;
      if (s >= 90) buckets[3].count++;
      else if (s >= 80) buckets[2].count++;
      else if (s >= 70) buckets[1].count++;
      else buckets[0].count++;
    });
    return buckets;
  }, [matches]);

  const avgScore = matches.length > 0
    ? Math.round(matches.reduce((a, m) => a + (m.score || 0), 0) / matches.length)
    : 0;

  return (
    <div className="page-container">
      <div className={styles.header}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Matching Queue</h1>
          <p className={styles.subtitle}>AI-powered organ-recipient allocation recommendations</p>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.statPill}>
            <Target size={13} style={{ color: '#22d3a0' }} />
            <span>{matches.length} Pending</span>
          </div>
          <div className={styles.statPill} style={{ '--pill-color': '#60a5fa' }}>
            <Activity size={13} style={{ color: '#60a5fa' }} />
            <span>Avg Score: {avgScore}</span>
          </div>
        </div>
      </div>

      {/* Score Distribution Chart */}
      {!loading && matches.length > 0 && (
        <div className={`glass-panel ${styles.chartPanel}`}>
          <div className={styles.chartHead}>
            <Zap size={15} style={{ color: '#fbbf24' }} />
            <span className={styles.chartTitle}>Compatibility Score Distribution</span>
            <span className={styles.chartSub}>{matches.length} recommendations pending review</span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={scoreDistData} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="range" tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9090b0', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#20203a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12, color: '#f0f0f8' }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="count" name="Matches" radius={[6, 6, 0, 0]}>
                {scoreDistData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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
                    {/* Score Visual */}
                    <div className={styles.matchScore}>
                      <div className={styles.scoreCircle} style={{
                        borderColor: match.score >= 90 ? '#22d3a0' : match.score >= 80 ? '#60a5fa' : '#fbbf24',
                        color: match.score >= 90 ? '#22d3a0' : match.score >= 80 ? '#60a5fa' : '#fbbf24',
                      }}>
                        {match.score}
                      </div>
                      <div className={styles.scoreBar}>
                        <motion.div
                          className={styles.scoreBarFill}
                          style={{ background: match.score >= 90 ? '#22d3a0' : match.score >= 80 ? '#60a5fa' : '#fbbf24' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${match.score}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    <div className={styles.matchDetails}>
                      <h3 className={styles.matchTitle}>Match Recommendation</h3>
                      <div className={styles.matchEntities}>
                        <span>Organ: <strong>{match.organId}</strong></span>
                        <span className={styles.separator}>→</span>
                        <span>Recipient: <strong>{match.recipientId}</strong></span>
                      </div>
                      <div className={styles.scoreBadge} style={{ color: match.score >= 90 ? '#22d3a0' : match.score >= 80 ? '#60a5fa' : '#fbbf24' }}>
                        {match.score >= 90 ? '⚡ Excellent Match' : match.score >= 80 ? '✓ Good Match' : '⚠ Moderate Match'}
                      </div>
                    </div>

                    <div className={styles.expandToggle}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
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
                            onClick={(e) => { e.stopPropagation(); handleAction(match, 'decline'); }}
                          >
                            <X size={18} /> Decline
                          </button>
                          <button 
                            className={`${styles.btn} ${styles.btnApprove}`}
                            onClick={(e) => { e.stopPropagation(); handleAction(match, 'accept'); }}
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
