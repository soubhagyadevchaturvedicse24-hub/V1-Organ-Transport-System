import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useSimulatorContext } from '../context/SimulatorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Cpu, Play, Square, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
 
const DashboardLayout = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const sim = useSimulatorContext();
  
  const [toasts, setToasts] = useState([]);
  const [simMinimized, setSimMinimized] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const addToast = (message, type = 'warning') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      
      // Auto-remove after 6 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 6000);
    };

    socket.on('transport:alert', (payload) => {
      addToast(`🚨 SLA Breach Alert: ${payload.alerts.join(', ')}`, 'critical');
    });

    socket.on('transport:health_change', (payload) => {
      if (payload.health && payload.health.status !== 'NORMAL') {
        addToast(`⚠️ Mission Health status changed to ${payload.health.status}! Reasons: ${payload.health.reasons?.join(', ') || ''}`, 'warning');
      }
    });

    return () => {
      socket.off('transport:alert');
      socket.off('transport:health_change');
    };
  }, [socket]);
 
  if (!user) {
    return <Navigate to="/login" replace />;
  }
 
  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <Outlet />
      </div>

      {/* Floating Global Toast Notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '24px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '320px',
        width: '100%',
        pointerEvents: 'none'
      }}>
        <AnimatePresence>
          {toasts.map(toast => {
            const isCritical = toast.type === 'critical';
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 100, scale: 0.9, transition: { duration: 0.15 } }}
                style={{
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  backdropFilter: 'blur(12px)',
                  border: isCritical ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  color: '#ffffff',
                  fontFamily: 'Inter, sans-serif'
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px', color: isCritical ? '#ef4444' : '#f59e0b' }} />
                <div style={{ flex: 1, fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.4 }}>
                  {toast.message}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  style={{
                    color: 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    marginTop: '2px',
                    transition: 'color 0.2s',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    padding: '2px'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.color = 'white'}
                  onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)'}
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Floating Global Simulator Panel */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 99998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none'
      }}>
        {simMinimized ? (
          <button
            onClick={() => setSimMinimized(false)}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: sim.running ? 'rgba(34, 211, 160, 0.95)' : 'rgba(32, 32, 58, 0.95)',
              border: '1px solid ' + (sim.running ? 'var(--brand-green)' : 'var(--glass-border)'),
              borderRadius: '24px',
              padding: '10px 16px',
              color: '#ffffff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              transition: 'all 0.2s'
            }}
          >
            <Cpu size={14} className={sim.running ? 'spin' : ''} style={{ animation: sim.running ? 'spin 4s linear infinite' : 'none' }} />
            <span>IoT Simulator: {sim.running ? 'ACTIVE' : 'OFFLINE'}</span>
            <ChevronUp size={14} />
          </button>
        ) : (
          <div style={{
            pointerEvents: 'auto',
            width: '320px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
              <Cpu size={16} style={{ color: 'var(--brand-purple)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>IoT Simulator Overlay</span>
              <button 
                onClick={() => setSimMinimized(true)}
                style={{ marginLeft: 'auto', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <ChevronDown size={16} />
              </button>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {!sim.running ? (
                <button 
                  onClick={sim.start}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'var(--brand-green)',
                    color: '#050508',
                    padding: '8px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <Play size={12} fill="#050508" /> Start
                </button>
              ) : (
                <button 
                  onClick={sim.stop}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    background: 'var(--brand-red)',
                    color: '#ffffff',
                    padding: '8px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  <Square size={12} fill="#ffffff" /> Stop
                </button>
              )}
              <button 
                onClick={sim.reset}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
              </button>
            </div>

            {/* Telemetry Display */}
            {sim.telemetry && (
              <div style={{
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)'
              }}>
                <span style={{ color: sim.telemetry.temperature > 8.0 ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
                  Temp: {sim.telemetry.temperature}°C
                </span>
                <span style={{ color: sim.telemetry.batteryLevel < 20.0 ? 'var(--brand-red)' : 'var(--text-secondary)' }}>
                  Bat: {sim.telemetry.batteryLevel}%
                </span>
                <span style={{ color: sim.telemetry.isTampered ? 'var(--brand-red)' : 'var(--brand-green)' }}>
                  {sim.telemetry.isTampered ? 'TAMPERED' : 'SECURE'}
                </span>
              </div>
            )}

            {/* Sliders / Overrides */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Force Temp (°C)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{sim.currentTemp}°C</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="15" 
                  step="0.5"
                  value={sim.currentTemp}
                  onChange={e => sim.overrideTemp(parseFloat(e.target.value))}
                  disabled={!sim.running}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-blue)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                  <span>Force Battery (%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{sim.currentBattery}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="1"
                  value={sim.currentBattery}
                  onChange={e => sim.overrideBattery(parseFloat(e.target.value))}
                  disabled={!sim.running}
                  style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-green)' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span>Force Tamper (Lid Open)</span>
                <input 
                  type="checkbox"
                  checked={sim.isTamperedMode}
                  onChange={e => sim.overrideTamper(e.target.checked)}
                  disabled={!sim.running}
                  style={{ cursor: 'pointer', width: '14px', height: '14px', accentColor: 'var(--brand-red)' }}
                />
              </div>
            </div>

            {/* Milestones Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px', borderTop: '1px solid var(--glass-border)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Trigger Milestones</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button 
                  onClick={() => sim.triggerMilestone('transport.created')}
                  style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  CREATED
                </button>
                <button 
                  onClick={() => sim.triggerMilestone('transport.dispatched')}
                  style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  DISPATCHED
                </button>
                <button 
                  onClick={() => sim.triggerMilestone('transport.arrived')}
                  style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  ARRIVED
                </button>
                <button 
                  onClick={() => sim.triggerMilestone('transport.completed')}
                  style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#8b5cf6', padding: '6px', borderRadius: '6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  COMPLETED
                </button>
              </div>
            </div>

            {/* Manual Release */}
            {sim.isManualMode && (
              <button 
                onClick={sim.releaseManual}
                style={{
                  background: 'rgba(251,191,36,0.1)',
                  border: '1px solid rgba(251,191,36,0.3)',
                  color: 'var(--brand-amber)',
                  borderRadius: '6px',
                  padding: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                  borderStyle: 'solid'
                }}
              >
                Manual Mode Active: Release
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
 
export default DashboardLayout;
