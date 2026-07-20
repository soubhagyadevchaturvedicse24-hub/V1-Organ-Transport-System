import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Map, ShieldCheck, HeartPulse } from 'lucide-react';
import styles from './Sidebar.module.css';

const Sidebar = () => {
  const links = [
    { name: 'Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Matching Queue', path: '/matching', icon: Users },
    { name: 'Live Transport', path: '/transport', icon: Map },
    { name: 'Blockchain Audit', path: '/audit', icon: ShieldCheck },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <HeartPulse className={styles.logoIcon} size={32} />
        <h2 className={styles.logoText}>NeoLife</h2>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) => 
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.systemStatus}>
          <div className={styles.statusDot}></div>
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
