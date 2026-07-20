import { Bell, Search, UserCircle } from 'lucide-react';
import styles from './Topbar.module.css';

const Topbar = () => {
  return (
    <header className={`${styles.topbar} glass-panel`}>
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={20} />
        <input 
          type="text" 
          placeholder="Search donors, organs, missions..." 
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <button className={styles.iconButton}>
          <Bell size={20} />
          <span className={styles.badge}>3</span>
        </button>
        
        <div className={styles.profile}>
          <UserCircle size={32} className={styles.avatar} />
          <div className={styles.userInfo}>
            <span className={styles.userName}>Dr. Admin</span>
            <span className={styles.userRole}>NOTTO Officer</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
