import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, GitFork, Map, ShieldCheck, HeartPulse, Cpu, LogOut } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '../context/AuthContext';

const ALL_LINKS = [
  { name: 'Command Center', path: '/dashboard/overview', icon: LayoutDashboard, section: 'Operations', roles: ['PLATFORM_ADMIN', 'HOSPITAL_COORDINATOR'] },
  { name: 'Matching Queue',  path: '/dashboard/matching', icon: GitFork,         section: null, roles: ['HOSPITAL_COORDINATOR'] },
  { name: 'Live Transport',  path: '/dashboard/transport', icon: Map,            section: null, roles: ['COURIER', 'PLATFORM_ADMIN', 'HOSPITAL_COORDINATOR'] },
  { name: 'Blockchain Audit',path: '/dashboard/audit',     icon: ShieldCheck,    section: 'Audit', roles: ['PLATFORM_ADMIN'] },
  { name: 'IoT Simulator',   path: '/dashboard/simulator', icon: Cpu,            section: 'Tools', isSimulator: true, roles: ['PLATFORM_ADMIN'] },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  let lastSection = null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filter links by user role
  const navLinks = ALL_LINKS.filter(link => link.roles.includes(user?.role));

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
        {user && (
          <div className={styles.userProfile} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.displayName}</span>
              <span className={styles.userRole}>{user.role?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')}</span>
            </div>
            <button 
              className={styles.logoutBtn} 
              onClick={handleLogout} 
              title="Logout"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '6px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
            >
              <LogOut size={14} /> LOGOUT
            </button>
          </div>
        )}
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
