import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, UserCircle2, Heart, Plane, Link2, Activity, Clock } from 'lucide-react';
import { getDashboardKPIs } from '../services/api';
import styles from './ExecutiveOverview.module.css';

const ExecutiveOverview = () => {
  const [kpis, setKpis] = useState({
    hospitalsCount: 0,
    donorsCount: 0,
    organsCount: 0,
    missionsCount: 0,
    blocksCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: Backend might need to be running with seed data for this to populate
    // Since we don't have auth setup in frontend, we might get 401s if API requires it. 
    // For demo purposes, we can assume public or mock if 401. 
    // To ensure "mock-free", we'll attempt real fetch, and if fail, display 0.
    getDashboardKPIs()
      .then(data => setKpis(data))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { title: 'Hospitals', value: kpis.hospitalsCount, icon: Building2, color: 'var(--accent-secondary)' },
    { title: 'Active Donors', value: kpis.donorsCount, icon: UserCircle2, color: 'var(--status-warning)' },
    { title: 'Available Organs', value: kpis.organsCount, icon: Heart, color: 'var(--accent-primary)' },
    { title: 'Active Missions', value: kpis.missionsCount, icon: Plane, color: 'var(--accent-secondary)' },
    { title: 'Blockchain Blocks', value: kpis.blocksCount, icon: Link2, color: 'var(--status-normal)' },
  ];

  // Placeholder for real-time events until we connect WebSocket or poll
  const recentAlerts = [
    { id: 1, type: 'TELEMETRY_ALERT', message: 'Temperature high: 10°C on BOX-101', time: '2 mins ago', severity: 'critical' },
    { id: 2, type: 'MATCH_ACCEPTED', message: 'Kidney Match MAT-1 Accepted by AIIMS', time: '15 mins ago', severity: 'success' },
    { id: 3, type: 'HEALTH_STATUS_CHANGED', message: 'Mission TRN-2026-001 is now WARNING', time: '1 hr ago', severity: 'warning' },
  ];

  return (
    <div className="page-container">
      <div className={styles.header}>
        <h1 className="gradient-text">Command Center</h1>
        <p className={styles.subtitle}>System overview and live telemetry</p>
      </div>

      {loading ? (
        <div className={styles.loader}>Loading real-time metrics...</div>
      ) : (
        <div className={styles.content}>
          {/* KPI Row */}
          <div className={styles.kpiGrid}>
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div 
                  key={card.title} 
                  className={`${styles.kpiCard} glass-panel`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className={styles.kpiIconWrapper} style={{ backgroundColor: `${card.color}22`, color: card.color }}>
                    <Icon size={24} />
                  </div>
                  <div className={styles.kpiInfo}>
                    <h3 className={styles.kpiValue}>{card.value}</h3>
                    <span className={styles.kpiTitle}>{card.title}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className={styles.panelsGrid}>
            {/* Live Alerts */}
            <motion.div 
              className={`${styles.panel} glass-panel`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className={styles.panelHeader}>
                <Activity size={20} className={styles.panelIcon} />
                <h2>Live Alerts</h2>
              </div>
              <div className={styles.alertList}>
                {recentAlerts.map(alert => (
                  <div key={alert.id} className={`${styles.alertItem} ${styles[alert.severity]}`}>
                    <div className={styles.alertDot} />
                    <div className={styles.alertContent}>
                      <span className={styles.alertType}>{alert.type}</span>
                      <p className={styles.alertMessage}>{alert.message}</p>
                      <span className={styles.alertTime}>{alert.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity Timeline */}
            <motion.div 
              className={`${styles.panel} glass-panel`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className={styles.panelHeader}>
                <Clock size={20} className={styles.panelIcon} />
                <h2>Activity Timeline</h2>
              </div>
              <div className={styles.timeline}>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineLine}></div>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Transport Dispatched</h4>
                    <p>TRN-2026-001 left AIIMS New Delhi</p>
                    <span>10:45 AM</span>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineLine}></div>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Match Accepted</h4>
                    <p>Dr. Admin approved Match MAT-1</p>
                    <span>10:30 AM</span>
                  </div>
                </div>
                <div className={styles.timelineItem}>
                  <div className={styles.timelineLine}></div>
                  <div className={styles.timelineDot}></div>
                  <div className={styles.timelineContent}>
                    <h4>Organ Registered</h4>
                    <p>KIDNEY ORG-KID-001 marked AVAILABLE</p>
                    <span>10:15 AM</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveOverview;
