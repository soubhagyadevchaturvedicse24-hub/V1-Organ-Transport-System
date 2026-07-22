import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, User, Heart, Users, Map, CheckCircle2, 
  AlertCircle, FileCheck, Save
} from 'lucide-react';
import { 
  createHospital, createDonor, createOrgan, 
  createRecipient, createMission 
} from '../services/api';
import styles from './DataEntryHub.module.css';

const TABS = [
  { id: 'hospital', label: 'Hospital Registration', icon: Building2 },
  { id: 'donor', label: 'Donor & Consent', icon: User },
  { id: 'organ', label: 'Organ Registry', icon: Heart },
  { id: 'recipient', label: 'Recipient Waitlist', icon: Users },
  { id: 'mission', label: 'Transport Mission', icon: Map }
];

export default function DataEntryHub() {
  const [activeTab, setActiveTab] = useState('hospital');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleFormSubmit = async (e, submitFn, tabName) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      // Small transformation for nested fields like geoLocation
      if (data.lat && data.lng) {
        data.geoLocation = {
          type: 'Point',
          coordinates: [parseFloat(data.lng), parseFloat(data.lat)]
        };
        delete data.lat;
        delete data.lng;
      }
      
      // Convert arrays
      if (data.transplantCapabilities) {
        data.transplantCapabilities = data.transplantCapabilities.split(',').map(s => s.trim());
      }
      if (data.age) data.age = parseInt(data.age, 10);
      if (data.medicalUrgencyScore) data.medicalUrgencyScore = parseInt(data.medicalUrgencyScore, 10);

      await submitFn(data);
      addToast(`${tabName} created successfully!`, 'success');
      e.target.reset();
    } catch (err) {
      addToast(err.message || `Failed to create ${tabName}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <motion.div className={styles.header} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={`gradient-text ${styles.title}`}>Data Entry Hub</h1>
        <p className={styles.subtitle}>Securely register and manage system entities</p>
      </motion.div>

      <div className={styles.tabs}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'hospital' && (
            <form className={styles.formCard} onSubmit={(e) => handleFormSubmit(e, createHospital, 'Hospital')}>
              <div className={styles.formHeader}>
                <Building2 size={24} style={{ color: 'var(--brand-blue)' }} />
                <h2>Register New Hospital</h2>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Hospital Code</label>
                  <input name="hospitalCode" className={styles.inputField} required placeholder="e.g. AIIMS-DEL" />
                </div>
                <div className={styles.formGroup}>
                  <label>Hospital Name</label>
                  <input name="name" className={styles.inputField} required placeholder="AIIMS New Delhi" />
                </div>
                <div className={styles.formGroup}>
                  <label>Registration Number</label>
                  <input name="registrationNumber" className={styles.inputField} required placeholder="REG-12345" />
                </div>
                <div className={styles.formGroup}>
                  <label>Hospital Type</label>
                  <select name="hospitalType" className={`${styles.inputField} ${styles.selectField}`} required>
                    <option value="GOVERNMENT">Government</option>
                    <option value="PRIVATE">Private</option>
                    <option value="TRUST">Trust</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Transplant Capabilities (comma separated)</label>
                  <input name="transplantCapabilities" className={styles.inputField} placeholder="KIDNEY, LIVER, HEART" />
                </div>
                <div className={styles.formGroup}>
                  <label>Email Contact</label>
                  <input name="email" type="email" className={styles.inputField} required placeholder="contact@hospital.org" />
                </div>
                <div className={styles.formGroup}>
                  <label>Phone Contact</label>
                  <input name="phone" className={styles.inputField} required placeholder="1234567890" pattern="\d{10}" />
                </div>
                <div className={styles.formGroup}>
                  <label>Latitude</label>
                  <input name="lat" type="number" step="any" className={styles.inputField} required placeholder="28.5659" />
                </div>
                <div className={styles.formGroup}>
                  <label>Longitude</label>
                  <input name="lng" type="number" step="any" className={styles.inputField} required placeholder="77.2090" />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <div className={styles.spinner} /> : <><Save size={18} /> Register Hospital</>}
              </button>
            </form>
          )}

          {activeTab === 'donor' && (
            <form className={styles.formCard} onSubmit={(e) => handleFormSubmit(e, createDonor, 'Donor')}>
              <div className={styles.formHeader}>
                <User size={24} style={{ color: 'var(--brand-purple)' }} />
                <h2>Register Donor & Consent</h2>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Donor Name</label>
                  <input name="name" className={styles.inputField} required placeholder="John Doe" />
                </div>
                <div className={styles.formGroup}>
                  <label>Age</label>
                  <input name="age" type="number" className={styles.inputField} required placeholder="35" />
                </div>
                <div className={styles.formGroup}>
                  <label>Blood Type</label>
                  <select name="bloodType" className={`${styles.inputField} ${styles.selectField}`} required>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Donor Type</label>
                  <select name="donorType" className={`${styles.inputField} ${styles.selectField}`} required>
                    <option value="LIVING">Living</option>
                    <option value="DECEASED">Deceased</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Consent Status</label>
                  <select name="consentStatus" className={`${styles.inputField} ${styles.selectField}`} required>
                    <option value="VERIFIED">Verified</option>
                    <option value="PENDING">Pending</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Registered Hospital ID</label>
                  <input name="registeredHospital" className={styles.inputField} required placeholder="MongoDB Object ID" />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <div className={styles.spinner} /> : <><Save size={18} /> Register Donor</>}
              </button>
            </form>
          )}

          {activeTab === 'organ' && (
            <form className={styles.formCard} onSubmit={(e) => handleFormSubmit(e, createOrgan, 'Organ')}>
              <div className={styles.formHeader}>
                <Heart size={24} style={{ color: 'var(--brand-green)' }} />
                <h2>Register Available Organ</h2>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Organ Type</label>
                  <select name="organType" className={`${styles.inputField} ${styles.selectField}`} required>
                    <option value="KIDNEY">Kidney</option>
                    <option value="LIVER">Liver</option>
                    <option value="HEART">Heart</option>
                    <option value="LUNG">Lung</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Donor ID</label>
                  <input name="donorId" className={styles.inputField} required placeholder="MongoDB Object ID" />
                </div>
                <div className={styles.formGroup}>
                  <label>Hospital ID (Location)</label>
                  <input name="hospitalId" className={styles.inputField} required placeholder="MongoDB Object ID" />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <div className={styles.spinner} /> : <><Save size={18} /> Register Organ</>}
              </button>
            </form>
          )}

          {activeTab === 'recipient' && (
            <form className={styles.formCard} onSubmit={(e) => handleFormSubmit(e, createRecipient, 'Recipient')}>
              <div className={styles.formHeader}>
                <Users size={24} style={{ color: 'var(--brand-amber)' }} />
                <h2>Add Recipient to Waitlist</h2>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Recipient Name</label>
                  <input name="name" className={styles.inputField} required placeholder="Jane Smith" />
                </div>
                <div className={styles.formGroup}>
                  <label>Needed Organ Type</label>
                  <select name="neededOrgan" className={`${styles.inputField} ${styles.selectField}`} required>
                    <option value="KIDNEY">Kidney</option>
                    <option value="LIVER">Liver</option>
                    <option value="HEART">Heart</option>
                    <option value="LUNG">Lung</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Blood Type</label>
                  <select name="bloodType" className={`${styles.inputField} ${styles.selectField}`} required>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Medical Urgency Score (1-100)</label>
                  <input name="medicalUrgencyScore" type="number" min="1" max="100" className={styles.inputField} required placeholder="85" />
                </div>
                <div className={styles.formGroup}>
                  <label>Attending Hospital ID</label>
                  <input name="hospitalId" className={styles.inputField} required placeholder="MongoDB Object ID" />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <div className={styles.spinner} /> : <><Save size={18} /> Add Recipient</>}
              </button>
            </form>
          )}

          {activeTab === 'mission' && (
            <form className={styles.formCard} onSubmit={(e) => handleFormSubmit(e, createMission, 'Mission')}>
              <div className={styles.formHeader}>
                <Map size={24} style={{ color: 'var(--brand-indigo)' }} />
                <h2>Dispatch Transport Mission</h2>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Match ID</label>
                  <input name="matchId" className={styles.inputField} required placeholder="MongoDB Object ID of the Match" />
                </div>
                <div className={styles.formGroup}>
                  <label>IoT Box ID</label>
                  <input name="boxId" className={styles.inputField} required placeholder="BOX-2026-ALPHA" />
                </div>
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? <div className={styles.spinner} /> : <><Save size={18} /> Dispatch Mission</>}
              </button>
            </form>
          )}
        </motion.div>
      </AnimatePresence>

      <div className={styles.toastContainer}>
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`${styles.toast} ${toast.type === 'error' ? styles.toastError : styles.toastSuccess}`}
            >
              {toast.type === 'error' ? <AlertCircle size={18} color="var(--status-critical)" /> : <CheckCircle2 size={18} color="var(--brand-green)" />}
              {toast.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
