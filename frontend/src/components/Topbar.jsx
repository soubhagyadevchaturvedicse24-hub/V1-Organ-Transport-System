import { useState, useEffect } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Topbar.module.css';

const Topbar = () => {
  const [time, setTime] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (n) => String(n).padStart(2, '0');
  const timeStr = `${fmt(time.getHours())}:${fmt(time.getMinutes())}:${fmt(time.getSeconds())}`;
  const dateStr = time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Get initials
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format role string nicely
  const formatRole = (role) => {
    if (!role) return 'User';
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  return (
    <header className={styles.topbar}>
      {/* Search */}
      <div className={styles.searchWrap}>
        <Search className={styles.searchIcon} size={16} />
        <input
          type="text"
          placeholder="Search donors, organs, missions…"
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        {/* Live Clock */}
        <div className={styles.timeDisplay}>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{timeStr}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>{dateStr}</div>
        </div>

        {/* Notifications */}
        <button className={styles.iconBtn} title="Notifications">
          <Bell size={16} />
          <span className={styles.badge}>0</span>
        </button>

        <div className={styles.divider} />

        {/* Profile */}
        <div className={styles.profile}>
          <div className={styles.avatar}>{getInitials(user?.displayName)}</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{user?.displayName || 'Loading...'}</span>
            <span className={styles.userRole}>{formatRole(user?.role)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
