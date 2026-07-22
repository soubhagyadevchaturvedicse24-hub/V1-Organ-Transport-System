import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Play, Square, RotateCcw, Thermometer, Battery,
  AlertTriangle, Wifi, WifiOff, CheckCircle2, Circle, ChevronRight,
  Activity, Package, Truck, MapPin, Heart, User, Zap, Lock, Unlock,
  RefreshCcw
} from 'lucide-react';
import { useSimulatorContext } from '../context/SimulatorContext';
import { getBaseUrl } from '../services/api';
import styles from './SimulatorPage.module.css';

/* ─── helpers ─────────────────────────────────────────────────── */
const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));



/* Directly execute a step in the backend (DB + Blockchain) with fail-safes */
const notarizeToChain = async (stepId, eventType, entityId, payload, deviceId, deviceSecret) => {
  const baseUrl = getBaseUrl();
  const headers = {
    'Content-Type': 'application/json',
    'x-device-id': deviceId || 'BOX-2026-FABRIC-ALPHA',
    'x-device-secret': deviceSecret || 'secret123',
  };

  // Attempt 1: Full E2E Simulator Execute Step (Creates DB entities + Blockchain block)
  try {
    const res1 = await fetch(`${baseUrl}/simulator/execute-step`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        stepId,
        eventType,
        entityId,
        payload,
      }),
    });
    if (res1.ok) return res1;
  } catch (e) {}

  // Attempt 2: Direct Audit Notarize
  try {
    const res2 = await fetch(`${baseUrl}/audit/notarize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        eventType,
        entityType: 'TransportMission',
        entityId,
        payload,
      }),
    });
    if (res2.ok) return res2;
  } catch (e) {}

  // Attempt 3: Device Milestone Endpoint
  try {
    const res3 = await fetch(`${baseUrl}/device/milestone`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        milestone: eventType,
        missionId: entityId,
        boxId: deviceId || 'BOX-2026-FABRIC-ALPHA',
        deviceSecret: deviceSecret || 'secret123',
        payload,
      }),
    });
    if (res3.ok) return res3;
  } catch (e) {}

  // Attempt 4: Device Telemetry Endpoint with milestone payload
  return await fetch(`${baseUrl}/device/telemetry`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      missionId: entityId,
      boxId: deviceId || 'BOX-2026-FABRIC-ALPHA',
      deviceSecret: deviceSecret || 'secret123',
      milestone: eventType,
      temperature: payload?.temperature ?? 4.0,
      batteryLevel: payload?.batteryLevel ?? 100,
      geoLocation: { type: 'Point', coordinates: [77.2090, 28.5659] },
      ...payload,
    }),
  });
};

/* ─── Step Definitions ──────────────────────────────────────────
   Each step has:
   - id, label, icon, color
   - description (shown in the step card)
   - action: async fn called when "Execute" is pressed; receives { addLog, cfg }; returns { ok, hash }
   - isManual: whether it needs user to adjust sliders (for telemetry steps)
──────────────────────────────────────────────────────────────── */

const makeSteps = (cfg) => [
  {
    id: 'donor_created',
    label: 'Register Donor',
    icon: User,
    color: '#a78bfa', // violet
    description: 'A brain-dead donor is admitted and registered in the system. Consent is verified. Blockchain records the donor registration.',
    eventType: 'DONOR_CREATED',
    entityType: 'Donor',
    entityId: 'DON-2026-SIM',
    payload: () => ({
      donorId: 'DON-2026-SIM',
      name: 'Simulation Donor',
      bloodType: 'O+',
      hospital: 'AIIMS Delhi',
      timestamp: new Date().toISOString(),
    }),
  },
  {
    id: 'organ_registered',
    label: 'Register Organ',
    icon: Heart,
    color: '#f87171', // red
    description: 'A viable kidney organ is harvested from the donor and registered with viability data. Blockchain records organ registration.',
    eventType: 'ORGAN_REGISTERED',
    entityType: 'Organ',
    entityId: 'ORG-2026-SIM',
    payload: () => ({
      organId: 'ORG-2026-SIM',
      donorId: 'DON-2026-SIM',
      type: 'Kidney',
      bloodType: 'O+',
      viabilityHours: 24,
      harvestTime: new Date().toISOString(),
    }),
  },
  {
    id: 'match_accepted',
    label: 'Match & Accept',
    icon: CheckCircle2,
    color: '#34d399', // emerald
    description: 'The organ matching engine finds a compatible recipient. The hospital accepts the match. Blockchain records the accepted match.',
    eventType: 'MATCH_ACCEPTED',
    entityType: 'Match',
    entityId: 'MATCH-2026-SIM',
    payload: () => ({
      matchId: 'MATCH-2026-SIM',
      organId: 'ORG-2026-SIM',
      recipientId: 'RCP-2026-SIM',
      recipientHospital: 'NIMHANS Bengaluru',
      score: 97.4,
      acceptedAt: new Date().toISOString(),
    }),
  },
  {
    id: 'transport_created',
    label: 'Create Transport',
    icon: Package,
    color: '#38bdf8', // sky
    description: 'A transport mission is created to move the organ from AIIMS Delhi to NIMHANS Bengaluru. Box BOX-2026-FABRIC-ALPHA is assigned.',
    eventType: 'transport.created',
    entityType: 'TransportMission',
    entityId: cfg.missionId,
    payload: () => ({
      missionId: cfg.missionId,
      boxId: cfg.boxId,
      organId: 'ORG-2026-SIM',
      origin: 'AIIMS Delhi',
      destination: 'NIMHANS Bengaluru',
      estimatedHours: 2.5,
      createdAt: new Date().toISOString(),
    }),
  },
  {
    id: 'transport_dispatched',
    label: 'Dispatch Transport',
    icon: Truck,
    color: '#10b981', // green
    description: 'The transport box is sealed and dispatched. IoT sensor begins transmitting live telemetry. Blockchain records dispatch.',
    eventType: 'transport.dispatched',
    entityType: 'TransportMission',
    entityId: cfg.missionId,
    payload: () => ({
      missionId: cfg.missionId,
      boxId: cfg.boxId,
      dispatchedAt: new Date().toISOString(),
      startLocation: 'AIIMS Delhi, 28.5659°N 77.2090°E',
      triggeredBy: 'IoT Simulator',
    }),
  },
  {
    id: 'telemetry_normal',
    label: 'Normal Telemetry',
    icon: Activity,
    color: '#94a3b8', // slate
    isManual: false,
    description: 'The box is in transit. Temperature is stable at 4°C. Battery 100%. Live telemetry ticking every 5s. You can adjust sliders below.',
    eventType: 'TELEMETRY_RECEIVED',
    entityType: 'TransportMission',
    entityId: cfg.missionId,
    payload: (telemetry) => ({
      missionId: cfg.missionId,
      temperature: telemetry?.temperature || 4.0,
      batteryLevel: telemetry?.batteryLevel || 100,
      isTampered: false,
      status: 'NORMAL',
      timestamp: new Date().toISOString(),
    }),
  },
  {
    id: 'telemetry_alert',
    label: 'Simulate Alert',
    icon: AlertTriangle,
    color: '#f59e0b', // amber
    description: 'Simulate a temperature spike or tamper event to trigger a CRITICAL alert on the blockchain. Raise temp above 8°C or toggle tamper.',
    eventType: 'TELEMETRY_ALERT',
    entityType: 'TransportMission',
    entityId: cfg.missionId,
    payload: (telemetry) => ({
      missionId: cfg.missionId,
      alerts: [
        telemetry?.temperature > 8 ? `Temperature HIGH: ${telemetry?.temperature}°C` : null,
        telemetry?.isTampered ? 'Box tamper detected!' : null,
      ].filter(Boolean),
      telemetry: {
        temperature: telemetry?.temperature || 9.5,
        batteryLevel: telemetry?.batteryLevel || 50,
        isTampered: telemetry?.isTampered || false,
      },
      timestamp: new Date().toISOString(),
    }),
  },
  {
    id: 'transport_arrived',
    label: 'Transport Arrived',
    icon: MapPin,
    color: '#fbbf24', // gold
    description: 'The transport box arrives at NIMHANS Bengaluru. Organ is handed over to the surgical team. Blockchain records arrival.',
    eventType: 'transport.arrived',
    entityType: 'TransportMission',
    entityId: cfg.missionId,
    payload: () => ({
      missionId: cfg.missionId,
      boxId: cfg.boxId,
      arrivedAt: new Date().toISOString(),
      destination: 'NIMHANS Bengaluru, 12.9447°N 77.5946°E',
      triggeredBy: 'IoT Simulator',
    }),
  },
  {
    id: 'transport_completed',
    label: 'Transport Completed',
    icon: CheckCircle2,
    color: '#c084fc', // purple
    description: 'Transplant surgery is successful. Mission is marked complete. Full audit trail is sealed on the blockchain.',
    eventType: 'transport.completed',
    entityType: 'TransportMission',
    entityId: cfg.missionId,
    payload: () => ({
      missionId: cfg.missionId,
      completedAt: new Date().toISOString(),
      outcome: 'SUCCESS',
      totalDurationMinutes: 148,
      triggeredBy: 'IoT Simulator',
    }),
  },
];

/* ─── GaugeBar ─────────────────────────────────────────────── */
const GaugeBar = ({ label, value, max, unit, color, icon: Icon, warn, critical }) => {
  const pct = clamp((value / max) * 100, 0, 100);
  const isCrit = critical != null && (unit === '°C' ? value > critical : value < critical);
  const isWarn = warn != null && (unit === '°C' ? value > warn : value < warn);
  const barColor = isCrit ? '#ef4444' : isWarn ? '#f59e0b' : color;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
        <Icon size={13} style={{ color: barColor }} />
        <span style={{ color: '#94a3b8', flex: 1 }}>{label}</span>
        <span style={{ color: barColor, fontFamily: 'monospace', fontWeight: 700 }}>
          {value != null ? `${value}${unit}` : '—'}
        </span>
        {isCrit && <AlertTriangle size={12} style={{ color: '#ef4444' }} />}
      </div>
      <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
        <motion.div
          style={{ height: '100%', background: barColor, borderRadius: '3px' }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 60 }}
        />
      </div>
    </div>
  );
};

/* ─── LogLine ──────────────────────────────────────────────── */
const LogLine = ({ entry }) => {
  const colorMap = { info: '#64748b', send: '#60a5fa', success: '#34d399', warn: '#fbbf24', error: '#f87171' };
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <span style={{ color: '#475569', flexShrink: 0, fontFamily: 'monospace' }}>{entry.ts}</span>
      <span style={{ color: colorMap[entry.type] || '#94a3b8', fontFamily: 'monospace' }}>{entry.msg}</span>
    </div>
  );
};

/* ─── SimulatorPage ────────────────────────────────────────── */
const SimulatorPage = () => {
  const sim = useSimulatorContext();
  const cfg = sim.cfg;

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [executing, setExecuting] = useState(false);
  const [stepResult, setStepResult] = useState({}); // stepId -> { ok, hash, blockIndex }

  const steps = makeSteps(cfg);

  const addLog = sim.addLog || (() => {});

  /* ── execute a step ─────────────────────────────────── */
  const executeStep = useCallback(async (step) => {
    setExecuting(true);
    const ts = new Date().toLocaleTimeString('en-IN', { hour12: false });

    try {
      addLog('info', `⚡ Notarizing: ${step.eventType} → ${step.entityId}`);

      const telemetry = sim.telemetry;
      const payload = step.payload(telemetry);

      const res = await notarizeToChain(
        step.id,
        step.eventType,
        step.entityId,
        payload,
        cfg.boxId,
        cfg.deviceSecret,
      );

      if (res.ok) {
        const data = await res.json();
        const bIdx = data.blockIndex ?? data.block?.blockIndex ?? '?';
        const bHash = data.hash ?? data.block?.hash ?? '';
        addLog('success', `✓ Block #${bIdx} registered in DB & Blockchain [${step.eventType}] hash:${(bHash || '').slice(0,10)}...`);
        setStepResult(prev => ({ ...prev, [step.id]: { ok: true, blockIndex: bIdx, hash: bHash } }));
        setCompletedSteps(prev => new Set([...prev, step.id]));
        if (currentStep === steps.findIndex(s => s.id === step.id)) {
          setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
        }
      } else {
        const errText = await res.text().catch(() => '');
        addLog('error', `✗ Notarize failed [${res.status}] ${errText.slice(0, 80)}`);
        setStepResult(prev => ({ ...prev, [step.id]: { ok: false } }));
      }
    } catch (err) {
      addLog('error', `✗ Network error — ${err.message}`);
      setStepResult(prev => ({ ...prev, [step.id]: { ok: false } }));
    } finally {
      setExecuting(false);
    }
  }, [sim.telemetry, cfg, currentStep, steps, addLog]);

  const resetAll = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setStepResult({});
    sim.reset();
  };

  const t = sim.telemetry;

  return (
    <div className="page-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'start' }}>

      {/* ── LEFT: Step Wizard ──────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={22} style={{ color: '#f59e0b' }} />
            <div>
              <h1 className="gradient-text-purple" style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>IoT Simulator</h1>
              <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>Sequential organ transport lifecycle</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {sim.connected === true && <span className="badge badge-online"><Wifi size={10} /> Live</span>}
            {sim.connected === false && <span className="badge badge-danger"><WifiOff size={10} /> Offline</span>}
            <button onClick={resetAll} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
              <RotateCcw size={13} /> Reset All
            </button>
          </div>
        </motion.div>

        {/* Progress bar */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', height: '4px', overflow: 'hidden' }}>
          <motion.div
            style={{ height: '100%', background: 'linear-gradient(90deg, #6366f1, #a855f7)' }}
            animate={{ width: `${(completedSteps.size / steps.length) * 100}%` }}
            transition={{ type: 'spring', stiffness: 60 }}
          />
        </div>
        <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'right', marginTop: '-6px' }}>
          {completedSteps.size} / {steps.length} steps completed
        </div>

        {/* Steps */}
        {steps.map((step, idx) => {
          const isDone = completedSteps.has(step.id);
          const isActive = idx === currentStep;
          const result = stepResult[step.id];
          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => !executing && setCurrentStep(idx)}
              style={{
                border: `1px solid ${isActive ? step.color + '80' : isDone ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)'}`,
                borderRadius: '12px',
                padding: '12px 14px',
                cursor: 'pointer',
                background: isActive
                  ? `${step.color}14`
                  : isDone
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(15,23,42,0.5)',
                transition: 'all 0.2s',
                opacity: idx > currentStep + 2 ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                {/* Step indicator */}
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isDone ? '#10b981' : isActive ? step.color : 'rgba(255,255,255,0.08)',
                  border: `2px solid ${isDone ? '#10b981' : isActive ? step.color : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: isActive ? `0 0 12px ${step.color}60` : 'none',
                }}>
                  {isDone
                    ? <CheckCircle2 size={16} color="#fff" />
                    : <Icon size={15} color={isActive ? '#fff' : '#64748b'} />
                  }
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.7rem', color: '#475569', fontFamily: 'monospace' }}>Step {idx + 1}</span>
                    {isDone && result?.blockIndex != null && (
                      <span style={{ fontSize: '0.65rem', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                        Block #{result.blockIndex}
                      </span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isActive ? '#f8fafc' : '#cbd5e1', marginBottom: '4px' }}>
                    {step.label}
                  </div>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}
                    >
                      {step.description}
                    </motion.p>
                  )}
                  <div style={{ fontSize: '0.65rem', color: '#475569', fontFamily: 'monospace', marginTop: '4px' }}>
                    {step.eventType}
                  </div>
                </div>

                {/* Execute button */}
                {isActive && (
                  <motion.button
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={(e) => { e.stopPropagation(); executeStep(step); }}
                    disabled={executing}
                    style={{
                      flexShrink: 0,
                      background: `linear-gradient(135deg, ${step.color}, ${step.color}bb)`,
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      color: '#0f172a',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      cursor: executing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      opacity: executing ? 0.6 : 1,
                      boxShadow: `0 4px 14px ${step.color}50`,
                    }}
                  >
                    {executing ? <RefreshCcw size={13} className={styles.spinning} /> : <Play size={13} fill="#0f172a" />}
                    {executing ? 'Writing…' : 'Notarize'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── RIGHT: Live Controls + Log ─────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'sticky', top: '1rem' }}>

        {/* IoT Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel"
          style={{ padding: '1rem' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: '10px' }}>
            <Cpu size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f8fafc' }}>Live IoT Controls</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              {!sim.running ? (
                <button onClick={sim.start}
                  style={{ background: '#10b981', border: 'none', borderRadius: '7px', padding: '5px 12px', color: '#0f172a', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Play size={11} fill="#0f172a" /> Start
                </button>
              ) : (
                <button onClick={sim.stop}
                  style={{ background: '#ef4444', border: 'none', borderRadius: '7px', padding: '5px 12px', color: '#fff', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Square size={11} fill="#fff" /> Stop
                </button>
              )}
            </div>
          </div>

          {/* Telemetry Gauges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <GaugeBar label="Temperature" value={t?.temperature ?? sim.currentTemp} max={15} unit="°C" color="#60a5fa" icon={Thermometer} warn={6} critical={8} />
            <GaugeBar label="Battery" value={t?.batteryLevel ?? sim.currentBattery} max={100} unit="%" color="#34d399" icon={Battery} />
          </div>

          {/* Tamper Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', background: sim.isTamperedMode ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${sim.isTamperedMode ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.07)'}`, marginBottom: '10px' }}>
            {sim.isTamperedMode ? <Unlock size={14} style={{ color: '#ef4444' }} /> : <Lock size={14} style={{ color: '#34d399' }} />}
            <span style={{ fontSize: '0.75rem', color: sim.isTamperedMode ? '#f87171' : '#34d399', fontWeight: 700, flex: 1 }}>
              {sim.isTamperedMode ? 'TAMPERED — Lid Open!' : 'SECURE — Box Sealed'}
            </span>
          </div>

          {/* Sliders */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Temp slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>
                <span>Force Temp (°C)</span>
                <span style={{ fontFamily: 'monospace', color: sim.currentTemp > 8 ? '#ef4444' : sim.currentTemp > 6 ? '#f59e0b' : '#34d399' }}>{sim.currentTemp}°C</span>
              </div>
              <input type="range" min="0" max="15" step="0.5"
                value={sim.currentTemp}
                onChange={e => sim.overrideTemp(parseFloat(e.target.value))}
                disabled={!sim.running}
                style={{ width: '100%', cursor: sim.running ? 'pointer' : 'not-allowed', accentColor: '#60a5fa' }}
              />
            </div>

            {/* Battery slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>
                <span>Force Battery (%)</span>
                <span style={{ fontFamily: 'monospace', color: sim.currentBattery < 20 ? '#ef4444' : '#34d399' }}>{sim.currentBattery}%</span>
              </div>
              <input type="range" min="0" max="100" step="1"
                value={sim.currentBattery}
                onChange={e => sim.overrideBattery(parseFloat(e.target.value))}
                disabled={!sim.running}
                style={{ width: '100%', cursor: sim.running ? 'pointer' : 'not-allowed', accentColor: '#34d399' }}
              />
            </div>

            {/* Tamper toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
              <span>Force Tamper (Lid Open)</span>
              <input type="checkbox"
                checked={sim.isTamperedMode}
                onChange={e => sim.overrideTamper(e.target.checked)}
                disabled={!sim.running}
                style={{ cursor: sim.running ? 'pointer' : 'not-allowed', width: '16px', height: '16px', accentColor: '#ef4444' }}
              />
            </div>

            {sim.isManualMode && (
              <button onClick={sim.releaseManual}
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', borderRadius: '6px', padding: '5px', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', textAlign: 'center' }}>
                Manual Override Active — Release
              </button>
            )}
          </div>
        </motion.div>

        {/* Completed chain summary */}
        {completedSteps.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel"
            style={{ padding: '0.85rem' }}
          >
            <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Blockchain Records Written
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {steps.filter(s => completedSteps.has(s.id)).map(s => {
                const result = stepResult[s.id];
                const Icon = s.icon;
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
                    <Icon size={11} style={{ color: s.color, flexShrink: 0 }} />
                    <span style={{ color: '#cbd5e1', flex: 1 }}>{s.label}</span>
                    {result?.blockIndex != null && (
                      <span style={{ fontFamily: 'monospace', color: '#34d399' }}>#{result.blockIndex}</span>
                    )}
                    <CheckCircle2 size={11} style={{ color: '#10b981' }} />
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Log Console */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel"
          style={{ padding: 0, overflow: 'hidden' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f87171' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#fbbf24' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22d3a0' }} />
            <span style={{ fontSize: '0.72rem', color: '#475569', marginLeft: '4px', fontFamily: 'monospace' }}>simulator.log</span>
            {sim.running && <span className="live-dot" style={{ marginLeft: 'auto' }} />}
          </div>
          <div style={{ height: '200px', overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column-reverse', gap: '1px' }}>
            {sim.logs.length === 0
              ? <p style={{ color: '#475569', fontSize: '0.75rem', margin: 0 }}>Awaiting simulation start…</p>
              : sim.logs.map(e => <LogLine key={e.id} entry={e} />)
            }
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimulatorPage;
