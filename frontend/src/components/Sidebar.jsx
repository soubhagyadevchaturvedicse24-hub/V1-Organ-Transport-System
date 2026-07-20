import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitFork, Map, ShieldCheck, HeartPulse, Cpu } from 'lucide-react';
import styles from './Sidebar.module.css';

const navLinks = [
  { name: 'Command Center', path: '/overview', icon: LayoutDashboard, section: 'Operations' },
  { name: 'Matching Queue',  path: '/matching', icon: GitFork,         section: null },
  { name: 'Live Transport',  path: '/transport', icon: Map,            section: null },
  { name: 'Blockchain Audit',path: '/audit',     icon: ShieldCheck,    section: 'Audit' },
  { name: 'IoT Simulator',   path: '/simulator', icon: Cpu,            section: 'Tools', isSimulator: true },
];

const Sidebar = () => {
  let lastSection = null;

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logoContainer}>
        <div className={styles.logoIconWrapper}>
          <HeartPulse size={22} />
        </div>
        <div>
          <h2 className={styles.logoText}>NeoLife</h2>
          <span className={styles.logoSub}>Transplant Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        {navLinks.map((link) => {
          const Icon = link.icon;
          const showSection = link.section && link.section !== lastSection;
          lastSection = link.section ?? lastSection;

          return (
            <div key={link.path}>
              {showSection && (
                <p className={styles.sectionLabel}>{link.section}</p>
              )}
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''} ${link.isSimulator ? styles.simulator : ''}`
                }
              >
                <span className={styles.navIcon}><Icon size={18} /></span>
                <span>{link.name}</span>
              </NavLink>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.systemStatus}>
          <span className="live-dot" />
          <span>All Systems Nominal</span>
        </div>
        <span className={styles.version}>v1.0.0-dashboard</span>
      </div>
    </aside>
  );
};

export default Sidebar;
