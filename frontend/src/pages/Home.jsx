import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, ShieldCheck, Map, ArrowRight } from 'lucide-react';
import styles from './Home.module.css';

const Home = () => {
  return (
    <div className={styles.homeContainer}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <HeartPulse size={28} className={styles.logoIcon} />
          NeoLife
        </div>
        <div className={styles.navLinks}>
          <a href="#about" className={styles.navLink}>About</a>
          <a href="#features" className={styles.navLink}>Features</a>
          <a href="#impact" className={styles.navLink}>Impact</a>
        </div>
        <Link to="/login" className={styles.loginBtn}>
          Platform Login
        </Link>
      </nav>

      <main className={styles.hero}>
        <div className={styles.heroBadge}>
          <span /> Live: Decentralized Transport Network Active
        </div>
        <h1 className={styles.title}>
          Securing the Future of <br />
          <span className={styles.highlight}>Organ Transplantation</span>
        </h1>
        <p className={styles.subtitle}>
          A blockchain-enabled, IoT-powered platform for matching, tracking, and auditing human organ logistics with zero compromise on safety.
        </p>
        <div className={styles.ctaGroup}>
          <Link to="/login" className={styles.primaryBtn}>
            Enter Dashboard <ArrowRight size={20} />
          </Link>
          <button className={styles.secondaryBtn}>
            View Documentation
          </button>
        </div>
      </main>

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <ShieldCheck size={26} />
          </div>
          <h3 className={styles.featureTitle}>Blockchain Auditing</h3>
          <p className={styles.featureDesc}>
            Immutable records of every organ transfer. Guaranteeing compliance and preventing trafficking with Hyperledger Fabric.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <HeartPulse size={26} />
          </div>
          <h3 className={styles.featureTitle}>Smart Matching</h3>
          <p className={styles.featureDesc}>
            Algorithmic donor-recipient matching based on medical urgency, compatibility, and geographical proximity.
          </p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>
            <Map size={26} />
          </div>
          <h3 className={styles.featureTitle}>IoT Cold Chain</h3>
          <p className={styles.featureDesc}>
            Real-time telemetry tracking temperature, humidity, and location from smart transport boxes via ESP32 sensors.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
