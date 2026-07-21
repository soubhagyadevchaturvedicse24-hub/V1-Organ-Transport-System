import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Stethoscope, Truck, ShieldUser } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/dashboard'); 
    } catch (error) {
      alert(error.message || 'Login failed');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <HeartPulse size={36} className={styles.logoIcon} />
            NeoLife
          </div>
          <p className={styles.subtitle}>Select your access role to enter the platform (Mock Auth)</p>
        </div>

        <div className={styles.rolesGrid}>
          <div 
            className={styles.roleCard} 
            onClick={() => handleLogin('contact@aiims.edu', 'aiims123aiims')}
          >
            <div className={styles.roleIcon} style={{ color: '#10b981' }}>
              <Stethoscope size={32} />
            </div>
            <h3 className={styles.roleTitle}>Medical / Hospital</h3>
            <p className={styles.roleDesc}>
              Access matching queue, patient profiles, and organ request logistics.
            </p>
          </div>

          <div 
            className={styles.roleCard}
            onClick={() => handleLogin('courier@transport.com', 'courier123courier')}
          >
            <div className={styles.roleIcon} style={{ color: '#3b82f6' }}>
              <Truck size={32} />
            </div>
            <h3 className={styles.roleTitle}>Transport Team</h3>
            <p className={styles.roleDesc}>
              Monitor live IoT telemetry, route optimization, and cold-chain status.
            </p>
          </div>

          <div 
            className={styles.roleCard}
            onClick={() => handleLogin('admin@platform.com', 'admin123admin')}
          >
            <div className={styles.roleIcon} style={{ color: '#f59e0b' }}>
              <ShieldUser size={32} />
            </div>
            <h3 className={styles.roleTitle}>Platform Admin</h3>
            <p className={styles.roleDesc}>
              Full overview, blockchain audit logs, and system simulation tools.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
