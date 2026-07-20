import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Play, Square, RotateCcw, Thermometer, Battery,
  Navigation, AlertTriangle, Wifi, WifiOff, Settings,
  MapPin, Zap, ChevronRight, Activity
} from 'lucide-react';
import styles from './SimulatorPage.module.css';

/* ════════════════════════════════════════════════════
   Pure in-browser IoT Simulator
   – Generates telemetry packets at configurable intervals
   – Shows a live log console
   – Attempts to POST to backend; falls back gracefully
════════════════════════════════════════════════════ */

const API = 'http://localhost:5000/api/v1';

const defaults = {
  boxId:       'BOX-2026-001',
  deviceSecret:'secret123',
  missionId:   'TRN-2026-001',
  interval:    5,        // seconds
  tempTarget:  4.0,      // °C ideal
  tempSpike:   8,        // % chance
  tamperChance:2,        // %
  batteryDrain:0.3,      // % per tick
  startLat:    28.5659,  // AIIMS Delhi
  startLng:    77.2090,
};

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const rand  = (mn, mx) => mn + Math.random() * (mx - mn);
const pct   = (chance) => Math.random() * 100 < chance;

function useSimulator(cfg) {
  const [running,  setRunning]  = useState(false);
  const [telemetry,setTelemetry]= useState(null);
  const [logs,     setLogs]     = useState([]);
  const [ticks,    setTicks]    = useState(0);
  const [connected,setConnected]= useState(null); // null=unknown, true, false

  const state = useRef({
    temp:    cfg.tempTarget,
    battery: 100,
    lat:     cfg.startLat,
    lng:     cfg.startLng,
  });

  const addLog = useCallback((type, msg) => {
    setLogs(prev => [{
      id:   Date.now() + Math.random(),
      type,          // 'info' | 'success' | 'warn' | 'error' | 'send'
      msg,
      ts:   new Date().toLocaleTimeString('en-IN', { hour12:false }),
    }, ...prev].slice(0, 200));
  }, []);

  const tick = useCallback(async () => {
    const s = state.current;

    // ── Compute next state ───────────────────────
    const spiked   = pct(cfg.tempSpike);
    const tampered = pct(cfg.tamperChance);

    if (spiked) {
      s.temp = rand(8.5, 11.5);
    } else {
      s.temp = clamp(s.temp + rand(-0.15, 0.15), cfg.tempTarget - 0.5, 10);
    }

    s.battery = clamp(s.battery - cfg.batteryDrain, 0, 100);

    // Move toward Tata Memorial Mumbai (19.0069, 72.8427)
    const dLat = 19.0069 - s.lat;
    const dLng = 72.8427 - s.lng;
    const dist  = Math.sqrt(dLat**2 + dLng**2);
    if (dist > 0.01) {
      s.lat += (dLat / dist) * 0.08;
      s.lng += (dLng / dist) * 0.08;
    }

    const payload = {
      missionId:   cfg.missionId,
      temperature: parseFloat(s.temp.toFixed(2)),
      batteryLevel:parseFloat(s.battery.toFixed(1)),
      isTampered:  tampered,
      geoLocation: { type:'Point', coordinates:[s.lng, s.lat] },
    };

    // Update display state
    setTelemetry({ ...payload, lat: s.lat, lng: s.lng, spiked, tampered });
    setTicks(t => t + 1);

    // ── Attempt API push ─────────────────────────
    const logMsg = `[TICK] Temp:${payload.temperature}°C  Bat:${payload.batteryLevel}%  Tamper:${tampered}  Spike:${spiked}`;
    addLog('send', logMsg);

    try {
      const res = await fetch(`${API}/device/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-device-id':    cfg.boxId,
          'x-device-secret':cfg.deviceSecret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(4000),
      });

      if (res.ok) {
        setConnected(true);
        addLog('success', `✓ Backend accepted  [${res.status}]`);
      } else {
        const txt = await res.text().catch(() => '');
        setConnected(false);
        addLog('warn', `✗ Backend rejected  [${res.status}] ${txt.slice(0,80)}`);
      }
    } catch (err) {
      setConnected(false);
      addLog('error', `✗ Cannot reach backend — ${err.message} (packet generated locally)`);
    }
  }, [cfg, addLog]);

  // Main loop
  const timerRef = useRef(null);

  const start = useCallback(() => {
    if (running) return;
    addLog('info', `▶ Simulator started — Box:${cfg.boxId}  Mission:${cfg.missionId}  Interval:${cfg.interval}s`);
    setRunning(true);
    tick(); // immediate first tick
    timerRef.current = setInterval(tick, cfg.interval * 1000);
  }, [running, tick, cfg, addLog]);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    setRunning(false);
    addLog('info', '■ Simulator stopped.');
  }, [addLog]);

  const reset = useCallback(() => {
    stop();
    state.current = { temp: cfg.tempTarget, battery: 100, lat: cfg.startLat, lng: cfg.startLng };
    setTelemetry(null);
    setTicks(0);
    setConnected(null);
    setLogs([]);
    addLog('info', '↺ Simulator reset.');
  }, [stop, cfg, addLog]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return { running, telemetry, logs, ticks, connected, start, stop, reset };
}

/* ════════════════════════════════════════════════════
   Sub-components
════════════════════════════════════════════════════ */
const GaugeBar = ({ label, value, max, unit, color, icon: Icon, warn, critical }) => {
  const pct = clamp((value / max) * 100, 0, 100);
  const isWarn = warn != null && value > warn;
  const isCrit = critical != null && value > critical;
  const barColor = isCrit ? 'var(--status-critical)' : isWarn ? 'var(--status-warning)' : color;

  return (
    <div className={styles.gauge}>
      <div className={styles.gaugeHeader}>
        <Icon size={15} style={{ color: barColor }} />
        <span className={styles.gaugeLabel}>{label}</span>
        <span className={styles.gaugeValue} style={{ color: barColor }}>
          {value != null ? `${value}${unit}` : '—'}
        </span>
        {isCrit && <AlertTriangle size={13} style={{ color:'var(--status-critical)', marginLeft:'auto' }} />}
      </div>
      <div className={styles.gaugeTrack}>
        <motion.div
          className={styles.gaugeFill}
          style={{ background: barColor }}
          animate={{ width: `${pct}%` }}
          transition={{ type:'spring', stiffness:80 }}
        />
      </div>
    </div>
  );
};

const LogLine = ({ entry }) => {
  const colorMap = {
    info:   'var(--text-tertiary)',
    send:   'var(--brand-blue)',
    success:'var(--brand-green)',
    warn:   'var(--brand-amber)',
    error:  'var(--brand-red)',
  };
  return (
    <div className={styles.logLine}>
      <span className={styles.logTs}>{entry.ts}</span>
      <span className={styles.logMsg} style={{ color: colorMap[entry.type] }}>{entry.msg}</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════
   Main Page
════════════════════════════════════════════════════ */
const SimulatorPage = () => {
  const [cfg, setCfg] = useState({ ...defaults });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...defaults });

  const sim = useSimulator(cfg);

  const applyConfig = () => {
    sim.reset();
    setCfg({ ...draft });
    setEditing(false);
  };

  const t = sim.telemetry;
  const connBadge = sim.connected === null
    ? <span className="badge badge-idle"><Wifi size={10} /> Pending</span>
    : sim.connected
      ? <span className="badge badge-online"><Wifi size={10} /> Connected</span>
      : <span className="badge badge-danger"><WifiOff size={10} /> Offline</span>;

  return (
    <div className="page-container">
      {/* Header */}
      <motion.div className={styles.header} initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
        <div>
          <div className={styles.titleRow}>
            <Cpu size={24} style={{ color:'var(--brand-amber)' }} />
            <h1 className={`gradient-text-purple ${styles.title}`}>IoT Simulator</h1>
            {sim.running && <span className="badge badge-warning"><span className="live-dot" style={{ background:'var(--brand-amber)' }} />RUNNING</span>}
          </div>
          <p className={styles.subtitle}>In-browser ESP32 transport box simulator — generates real telemetry packets</p>
        </div>
        <div className={styles.connStatus}>{connBadge}</div>
      </motion.div>

      <div className={styles.layout}>
        {/* ── LEFT COLUMN ──────────────────────────── */}
        <div className={styles.leftCol}>

          {/* Controls */}
          <motion.div className={`glass-panel ${styles.controlCard}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
            <div className={styles.cardHead}>
              <Activity size={16} style={{ color:'var(--brand-amber)' }} />
              <h3>Simulation Controls</h3>
            </div>

            <div className={styles.btnRow}>
              {!sim.running ? (
                <button className="btn btn-primary" onClick={sim.start} style={{ background:'linear-gradient(135deg,var(--brand-amber),#d97706)', boxShadow:'var(--glow-amber)' }}>
                  <Play size={16} /> Start Simulation
                </button>
              ) : (
                <button className="btn btn-danger" onClick={sim.stop}>
                  <Square size={16} /> Stop
                </button>
              )}
              <button className="btn btn-ghost" onClick={sim.reset} disabled={sim.running}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.stat}>
                <span className={styles.statVal}>{sim.ticks}</span>
                <span className={styles.statLbl}>Ticks Sent</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statVal}>{cfg.interval}s</span>
                <span className={styles.statLbl}>Interval</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statVal} style={{ color:'var(--brand-amber)' }}>{cfg.boxId}</span>
                <span className={styles.statLbl}>Box ID</span>
              </div>
            </div>
          </motion.div>

          {/* Live Gauges */}
          <motion.div className={`glass-panel ${styles.gaugeCard}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}>
            <div className={styles.cardHead}>
              <Zap size={16} style={{ color:'var(--brand-green)' }} />
              <h3>Live Telemetry</h3>
            </div>

            {!t ? (
              <p className={styles.waiting}>Start simulation to see live telemetry…</p>
            ) : (
              <div className={styles.gaugeList}>
                <GaugeBar
                  label="Temperature" value={t.temperature} max={15} unit="°C"
                  color="var(--brand-blue)" icon={Thermometer}
                  warn={6} critical={8}
                />
                <GaugeBar
                  label="Battery" value={t.batteryLevel} max={100} unit="%"
                  color="var(--brand-green)" icon={Battery}
                />
                <div className={styles.locationRow}>
                  <MapPin size={14} style={{ color:'var(--brand-purple)' }} />
                  <span className={styles.locationLabel}>GPS</span>
                  <span className={`mono ${styles.locationVal}`}>
                    {t.lat?.toFixed(4)}°N, {t.lng?.toFixed(4)}°E
                  </span>
                </div>
                <AnimatePresence>
                  {t.tampered && (
                    <motion.div
                      className={styles.alertBanner}
                      initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                    >
                      <AlertTriangle size={16} /> TAMPER ALERT — Device integrity compromised!
                    </motion.div>
                  )}
                  {t.spiked && (
                    <motion.div
                      className={`${styles.alertBanner} ${styles.alertTemp}`}
                      initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                    >
                      <Thermometer size={16} /> TEMPERATURE SPIKE — Organ viability at risk!
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>

          {/* Config panel */}
          <motion.div className={`glass-panel ${styles.configCard}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}>
            <div className={styles.cardHead}>
              <Settings size={16} style={{ color:'var(--text-secondary)' }} />
              <h3>Configuration</h3>
              <button
                className={`btn btn-ghost ${styles.editBtn}`}
                onClick={() => { setDraft({...cfg}); setEditing(e => !e); }}
                disabled={sim.running}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            <AnimatePresence>
              {editing ? (
                <motion.div className={styles.configForm}
                  initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}>
                  {[
                    { key:'boxId',       label:'Box ID',            type:'text' },
                    { key:'deviceSecret',label:'Device Secret',     type:'password' },
                    { key:'missionId',   label:'Mission ID',        type:'text' },
                    { key:'interval',    label:'Interval (seconds)',type:'number', min:2, max:60 },
                    { key:'tempTarget',  label:'Target Temp (°C)',  type:'number', step:0.5 },
                    { key:'tempSpike',   label:'Spike Chance (%)',  type:'number', min:0, max:100 },
                    { key:'batteryDrain',label:'Battery Drain/tick',type:'number', step:0.1, min:0 },
                  ].map(f => (
                    <div key={f.key} className={styles.formRow}>
                      <label className={styles.formLabel}>{f.label}</label>
                      <input
                        className={`input-field ${styles.formInput}`}
                        type={f.type}
                        value={draft[f.key]}
                        min={f.min} max={f.max} step={f.step}
                        onChange={e => setDraft(d => ({ ...d, [f.key]: f.type === 'number' ? parseFloat(e.target.value)||0 : e.target.value }))}
                      />
                    </div>
                  ))}
                  <button className="btn btn-primary" onClick={applyConfig} style={{ marginTop: 'var(--sp-3)', width:'100%', justifyContent:'center' }}>
                    <ChevronRight size={16} /> Apply & Reset
                  </button>
                </motion.div>
              ) : (
                <motion.div className={styles.configList}
                  initial={{ opacity:0 }} animate={{ opacity:1 }}>
                  {[
                    ['Box ID',       cfg.boxId],
                    ['Mission ID',   cfg.missionId],
                    ['Interval',     `${cfg.interval}s`],
                    ['Target Temp',  `${cfg.tempTarget}°C`],
                    ['Spike Chance', `${cfg.tempSpike}%`],
                    ['Battery Drain',`${cfg.batteryDrain}%/tick`],
                  ].map(([k,v]) => (
                    <div key={k} className={styles.configRow}>
                      <span className={styles.configKey}>{k}</span>
                      <span className={`mono ${styles.configVal}`}>{v}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN – Log Console ─────────── */}
        <motion.div className={`glass-panel ${styles.console}`} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.2 }}>
          <div className={styles.consoleHead}>
            <div className={styles.consoleDots}>
              <span style={{ background:'#f87171' }} />
              <span style={{ background:'#fbbf24' }} />
              <span style={{ background:'#22d3a0' }} />
            </div>
            <span className={styles.consoleName}>simulator.log — live output</span>
            {sim.running && <span className="live-dot" style={{ marginLeft:'auto' }} />}
          </div>

          <div className={`${styles.logBody} panel-scroll`}>
            {sim.logs.length === 0 ? (
              <p className={styles.logEmpty}>Awaiting simulation start…</p>
            ) : (
              <AnimatePresence initial={false}>
                {sim.logs.map(e => (
                  <motion.div key={e.id} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}>
                    <LogLine entry={e} />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SimulatorPage;
