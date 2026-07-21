import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Play, Square, RotateCcw, Thermometer, Battery,
  AlertTriangle, Wifi, WifiOff, Settings,
  MapPin, Zap, ChevronRight, Activity
} from 'lucide-react';
import { useSimulatorContext } from '../context/SimulatorContext';
import styles from './SimulatorPage.module.css';

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

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
  const sim = useSimulatorContext();
  const cfg = sim.cfg;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...cfg });

  // Sync draft if config updates globally
  useEffect(() => {
    setDraft({ ...cfg });
  }, [cfg]);

  const applyConfig = () => {
    sim.reset();
    sim.setCfg({ ...draft });
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

          {/* Live Overrides */}
          <motion.div className={`glass-panel ${styles.controlCard}`} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}>
            <div className={styles.cardHead}>
              <Settings size={16} style={{ color:'var(--brand-purple)' }} />
              <h3>Live Overrides</h3>
              {sim.isManualMode && (
                <button 
                  onClick={sim.releaseManual} 
                  className="badge badge-warning" 
                  style={{ marginLeft: 'auto', fontSize: '9px', border: '1px solid rgba(251,191,36,0.5)', padding: '2px 8px', cursor: 'pointer' }}
                >
                  Manual Control: Active [Release]
                </button>
              )}
            </div>
            <div className={styles.overrideList}>
              <div className={styles.overrideRow}>
                <label className={styles.overrideLabel}>Force Temp (°C)</label>
                <input type="range" className={styles.slider} min="0" max="15" step="0.5"
                  value={sim.currentTemp}
                  onChange={e => sim.overrideTemp(parseFloat(e.target.value))}
                  disabled={!sim.running}
                />
                <span className={`mono ${styles.overrideVal}`}>{sim.currentTemp}°C</span>
              </div>
              <div className={styles.overrideRow}>
                <label className={styles.overrideLabel}>Force Battery (%)</label>
                <input type="range" className={styles.slider} min="0" max="100" step="1"
                  value={sim.currentBattery}
                  onChange={e => sim.overrideBattery(parseFloat(e.target.value))}
                  disabled={!sim.running}
                />
                <span className={`mono ${styles.overrideVal}`}>{sim.currentBattery}%</span>
              </div>
              <div className={styles.overrideRow}>
                <label className={styles.overrideLabel}>Force Tamper (Lid Open)</label>
                <input type="checkbox"
                  checked={sim.isTamperedMode}
                  onChange={e => sim.overrideTamper(e.target.checked)}
                  disabled={!sim.running}
                  style={{ cursor: 'pointer', margin: '0 8px', width: '16px', height: '16px', accentColor: 'var(--brand-red)' }}
                />
                <span className={`mono ${styles.overrideVal}`} style={{ color: sim.isTamperedMode ? 'var(--status-critical)' : 'var(--text-secondary)' }}>
                  {sim.isTamperedMode ? 'TAMPERED' : 'SECURE'}
                </span>
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
