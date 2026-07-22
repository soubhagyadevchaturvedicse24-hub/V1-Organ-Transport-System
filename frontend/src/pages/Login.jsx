import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, Stethoscope, Truck, ShieldCheck, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from './Login.module.css';

const ROLES = [
  {
    roleKey: 'admin',
    title: 'Platform Admin',
    email: 'admin@platform.com',
    pass: 'admin123admin',
    icon: ShieldCheck,
    color: '#f59e0b',
    desc: 'Full system audit logs, blockchain verification & platform settings.'
  },
  {
    roleKey: 'hospital',
    title: 'Medical / Hospital',
    email: 'contact@aiims.edu',
    pass: 'aiims123aiims',
    icon: Stethoscope,
    color: '#10b981',
    desc: 'Manage donors, organs, viability metrics & recipient queue.'
  },
  {
    roleKey: 'transport',
    title: 'Transport Team',
    email: 'courier@transport.com',
    pass: 'courier123courier',
    icon: Truck,
    color: '#3b82f6',
    desc: 'Live IoT box telemetry, GPS tracking & cold-chain status.'
  }
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@platform.com');
  const [password, setPassword] = useState('admin123admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelect = (role) => {
    setEmail(role.email);
    setPassword(role.pass);
    setError(null);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <HeartPulse size={40} className={styles.logoIcon} />
            <span>NeoLife</span>
          </div>
          <p className={styles.subtitle}>
            Blockchain & IoT Powered Organ Logistics Platform
          </p>
        </div>

        <div className={styles.mainGrid}>
          {/* Left Column: Email & Password Form */}
          <div className={styles.formCard}>
            <div className={styles.formHeader}>
              <h2>Account Login</h2>
              <p>Enter your credentials to access your dashboard</p>
            </div>

            {error && (
              <div className={styles.errorAlert}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hospital.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className={styles.btnLogin}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Platform</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Demo Roles & Quick Credentials */}
          <div className={styles.demoRolesCard}>
            <div className={styles.demoHeader}>
              <h3>Demo Login Credentials</h3>
              <p>Click any role card below to auto-fill credentials</p>
            </div>

            <div className={styles.roleList}>
              {ROLES.map((r) => {
                const Icon = r.icon;
                const isSelected = email === r.email;

                return (
                  <div
                    key={r.roleKey}
                    className={`${styles.roleItem} ${isSelected ? styles.selectedRole : ''}`}
                    onClick={() => handleQuickSelect(r)}
                  >
                    <div className={styles.roleIconBadge} style={{ color: r.color, background: `${r.color}15` }}>
                      <Icon size={22} />
                    </div>
                    <div className={styles.roleDetails}>
                      <div className={styles.roleTitleRow}>
                        <span className={styles.roleName}>{r.title}</span>
                        {isSelected && <span className={styles.activeTag}>Selected</span>}
                      </div>
                      <div className={styles.credentialText}>
                        <code>{r.email}</code> • <code>{r.pass}</code>
                      </div>
                      <p className={styles.roleDescription}>{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
