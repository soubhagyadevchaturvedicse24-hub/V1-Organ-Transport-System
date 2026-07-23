import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Thermometer, Battery, Navigation,
  AlertTriangle, CheckCircle2, MapPin, RefreshCw,
  Cpu, Play, Square, RotateCcw, Lock, Unlock,
  Wifi, WifiOff, X, ChevronUp, Truck, Radio
} from 'lucide-react';
import { getMissions, getLiveMission } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useSimulatorContext } from '../context/SimulatorContext';
import styles from './TransportMap.module.css';

// ═══════════════════════════════════════════════════
// Leaflet icon setup
// ═══════════════════════════════════════════════════
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* SVG-based pulsing icon for the moving transport box */
const makeBoxIcon = (status) => {
  const col = status === 'CRITICAL' ? '#f87171' : status === 'WARNING' ? '#fbbf24' : '#22d3a0';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="16" fill="${col}" opacity="0.15">
      <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.2;0.05;0.2" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="18" cy="18" r="10" fill="${col}" stroke="white" stroke-width="2.5"/>
    <circle cx="18" cy="18" r="3.5" fill="white"/>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: '',
    iconSize:   [36, 36],
    iconAnchor: [18, 18],
  });
};

const HospitalIcon = (color) => new L.DivIcon({
  html: `<div style="width:14px;height:14px;border-radius:3px;background:${color};border:2px solid white;box-shadow:0 0 8px ${color};"></div>`,
  className: '',
  iconSize:   [14, 14],
  iconAnchor: [7, 7],
});

/* Auto-fit map bounds to include origin, destination, and current position */
const MapBounds = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 0) {
      const valid = points.filter(p => p[0] !== 0 || p[1] !== 0);
      if (valid.length > 1) {
        const bounds = L.latLngBounds(valid);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8, animate: true, duration: 1 });
      } else if (valid.length === 1) {
        map.setView(valid[0], 6, { animate: true, duration: 1 });
      }
    }
  }, [points, map]);
  return null;
};

/* Safely extract string from potentially-populated MongoDB object */
const safeStr = (val, fallback = '—') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val || fallback;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object' && !Array.isArray(val)) {
    return val.name || val.missionId || val.deviceId || val._id?.toString() || fallback;
  }
  return fallback;
};

/* Get status color */
const statusColor = (s) => {
  if (!s) return '#9090b0';
  const up = String(s).toUpperCase();
  if (up === 'IN_TRANSIT' || up === 'DISPATCHED') return '#22d3a0';
  if (up === 'COMPLETED') return '#a78bfa';
  if (up === 'CANCELLED') return '#f87171';
  if (up === 'PENDING') return '#fbbf24';
  return '#60a5fa';
};

// ═══════════════════════════════════════════════════
// Simulator Overlay Component
// ═══════════════════════════════════════════════════
const SimulatorOverlay = ({ onClose }) => {
  const sim = useSimulatorContext();
  if (!sim) return null;

  const tempColor = sim.currentTemp > 8 ? '#ef4444' : sim.currentTemp > 6 ? '#f59e0b' : '#34d399';
  const batColor = sim.currentBattery < 20 ? '#ef4444' : '#34d399';
  const tempPct = Math.min((sim.currentTemp / 15) * 100, 100);
  const batPct = Math.min(sim.currentBattery, 100);

  return (
    <motion.div
      className={styles.simOverlay}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className={styles.simHeader}>
        <Cpu size={16} style={{ color: '#fbbf24' }} />
        <span className={styles.simTitle}>IoT Simulator Panel</span>
        {sim.connected === true && (
          <span className={`${styles.connBadge} ${styles.connOnline}`}><Wifi size={10} /> Live</span>
        )}
        {sim.connected === false && (
          <span className={`${styles.connBadge} ${styles.connOffline}`}><WifiOff size={10} /> Offline</span>
        )}
        <button className={styles.simClose} onClick={onClose}><X size={12} /> Close</button>
      </div>

      <div className={styles.simControls}>
        {/* Left: Controls */}
        <div className={styles.simSection}>
          {/* Start/Stop/Reset buttons */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
            {!sim.running ? (
              <button className={`${styles.simBtn} ${styles.simBtnStart}`} onClick={sim.start}>
                <Play size={12} fill="#0f172a" /> Start Telemetry
              </button>
            ) : (
              <button className={`${styles.simBtn} ${styles.simBtnStop}`} onClick={sim.stop}>
                <Square size={12} fill="#fff" /> Stop
              </button>
            )}
            <button className={`${styles.simBtn} ${styles.simBtnReset}`} onClick={sim.reset}>
              <RotateCcw size={12} /> Reset
            </button>
          </div>

          {/* Temp Slider */}
          <div className={styles.simSliderGroup}>
            <div className={styles.simSliderLabel}>
              <span><Thermometer size={11} style={{ color: tempColor }} /> Temperature</span>
              <span className={styles.simSliderVal} style={{ color: tempColor }}>{sim.currentTemp}°C</span>
            </div>
            <input
              type="range" min="0" max="15" step="0.5"
              value={sim.currentTemp}
              onChange={e => sim.overrideTemp(parseFloat(e.target.value))}
              disabled={!sim.running}
              className={styles.simSlider}
              style={{ accentColor: tempColor }}
            />
            <div className={styles.simGaugeTrack}>
              <div className={styles.simGaugeFill} style={{ width: `${tempPct}%`, background: tempColor }} />
            </div>
          </div>

          {/* Battery Slider */}
          <div className={styles.simSliderGroup}>
            <div className={styles.simSliderLabel}>
              <span><Battery size={11} style={{ color: batColor }} /> Battery</span>
              <span className={styles.simSliderVal} style={{ color: batColor }}>{sim.currentBattery}%</span>
            </div>
            <input
              type="range" min="0" max="100" step="1"
              value={sim.currentBattery}
              onChange={e => sim.overrideBattery(parseFloat(e.target.value))}
              disabled={!sim.running}
              className={styles.simSlider}
              style={{ accentColor: batColor }}
            />
            <div className={styles.simGaugeTrack}>
              <div className={styles.simGaugeFill} style={{ width: `${batPct}%`, background: batColor }} />
            </div>
          </div>
        </div>

        {/* Right: Tamper & Status */}
        <div className={styles.simSection}>
          {/* Tamper control */}
          <div className={`${styles.simTamperRow} ${sim.isTamperedMode ? styles.simTamperOpen : styles.simTamperSecure}`}>
            {sim.isTamperedMode ? <Unlock size={14} /> : <Lock size={14} />}
            <span style={{ flex: 1 }}>{sim.isTamperedMode ? 'TAMPERED — Lid Open!' : 'SECURE — Box Sealed'}</span>
            <input
              type="checkbox"
              className={styles.simCheckbox}
              checked={sim.isTamperedMode}
              onChange={e => sim.overrideTamper(e.target.checked)}
              disabled={!sim.running}
            />
          </div>

          {/* Manual override release */}
          {sim.isManualMode && (
            <button className={styles.simManualRelease} onClick={sim.releaseManual}>
              Manual Override Active — Click to Release
            </button>
          )}

          {/* Config info */}
          <div style={{ fontSize: '0.7rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Box ID:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{sim.cfg.boxId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Mission:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{sim.cfg.missionId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Interval:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>{sim.cfg.interval}s</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Ticks Sent:</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{sim.ticks}</span>
            </div>
          </div>

          {/* ESP32 Ready badge */}
          <div style={{
            marginTop: '6px',
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 10px', borderRadius: '8px',
            background: 'rgba(96,165,250,0.08)',
            border: '1px solid rgba(96,165,250,0.2)',
            fontSize: '0.68rem', color: '#60a5fa',
          }}>
            <Radio size={11} />
            <span>ESP32-ready — same <code style={{ background: 'rgba(0,0,0,0.3)', padding: '1px 4px', borderRadius: '3px' }}>transport:telemetry</code> socket event</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ═══════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════
const TransportMap = () => {
  const [allMissions, setAllMissions] = useState([]);
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tempHistory, setTempHistory] = useState([4.0, 4.1, 3.9, 4.2, 4.0, 4.3, 4.1]);
  const [showSim, setShowSim] = useState(false);
  const socket = useSocket();
  const sim = useSimulatorContext();
  const prevMissionRef = useRef(null);

  // ── Fetch all missions for the switcher ──
  const fetchAllMissions = useCallback(async () => {
    try {
      const data = await getMissions();
      const arr = Array.isArray(data) ? data : (data?.missions || []);
      setAllMissions(arr);
      return arr;
    } catch {
      return [];
    }
  }, []);

  // ── Load a specific mission by ID ──
  const loadMission = useCallback(async (missionId) => {
    try {
      const data = await getLiveMission(missionId);
      if (!data) return;

      let initialLoc = { lat: 0, lng: 0 };
      const trail = [];

      if (data.originHospital?.geoLocation) {
        initialLoc = {
          lat: data.originHospital.geoLocation.coordinates[1],
          lng: data.originHospital.geoLocation.coordinates[0],
        };
        trail.push([initialLoc.lat, initialLoc.lng]);
      }

      if (data.chainOfCustody?.length > 0) {
        const lastPoint = [...data.chainOfCustody].reverse().find(e => e.location?.coordinates);
        if (lastPoint) {
          initialLoc = {
            lat: lastPoint.location.coordinates[1],
            lng: lastPoint.location.coordinates[0],
          };
        }
        data.chainOfCustody.forEach(evt => {
          if (evt.location?.coordinates) {
            trail.push([evt.location.coordinates[1], evt.location.coordinates[0]]);
          }
        });
      }

      setMission({
        ...data,
        currentLocation: initialLoc,
        telemetry: data.telemetry || { temperature: 4.0, batteryLevel: 100, isTampered: false },
        health: data.health || { status: 'NORMAL' },
        trail,
      });
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Failed to load mission:', err);
    }
  }, []);

  // ── Initial load ──
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const missions = await fetchAllMissions();

      if (missions.length > 0) {
        // Prefer IN_TRANSIT, then most recent
        const active = missions.find(m => m.status === 'IN_TRANSIT')
          || missions.find(m => m.status === 'DISPATCHED')
          || missions[0];
        const id = active.missionId || active._id;
        setActiveMissionId(id);
        await loadMission(id);
      }
      setLoading(false);
    };
    init();
  }, [fetchAllMissions, loadMission]);

  // ── Switch mission ──
  const switchMission = useCallback(async (m) => {
    const id = m.missionId || m._id;
    if (id === activeMissionId) return;
    setActiveMissionId(id);
    setTempHistory([4.0, 4.1, 3.9, 4.2, 4.0, 4.3, 4.1]);
    await loadMission(id);
  }, [activeMissionId, loadMission]);

  // ── Socket real-time updates ──
  useEffect(() => {
    if (!socket || !mission) return;

    // Leave previous mission room
    if (prevMissionRef.current && prevMissionRef.current !== mission._id) {
      socket.emit('leave_mission', prevMissionRef.current);
    }
    prevMissionRef.current = mission._id;
    socket.emit('join_mission', mission._id);

    const handleTelemetry = (payload) => {
      if (payload.missionId !== mission._id && payload.missionId !== activeMissionId) return;

      if (payload.temperature !== undefined) {
        setTempHistory(prev => [...prev, payload.temperature].slice(-20));
      }

      setMission(prev => {
        if (!prev) return prev;
        const lat = payload.location?.coordinates?.[1] ?? prev.currentLocation.lat;
        const lng = payload.location?.coordinates?.[0] ?? prev.currentLocation.lng;
        const trail = [...(prev.trail || []), [lat, lng]];
        if (trail.length > 200) trail.shift();

        return {
          ...prev,
          currentLocation: { lat, lng },
          telemetry: {
            temperature: payload.temperature ?? prev.telemetry?.temperature,
            batteryLevel: payload.batteryLevel ?? prev.telemetry?.batteryLevel,
            isTampered: payload.isTampered ?? prev.telemetry?.isTampered,
          },
          trail,
        };
      });
      setLastUpdate(new Date());
    };

    const handleHealthChange = (payload) => {
      if (payload.missionId !== mission._id && payload.missionId !== activeMissionId) return;
      setMission(prev => prev ? { ...prev, health: payload.health } : prev);
    };

    socket.on('transport:telemetry', handleTelemetry);
    socket.on('transport:health_change', handleHealthChange);

    return () => {
      socket.off('transport:telemetry', handleTelemetry);
      socket.off('transport:health_change', handleHealthChange);
    };
  }, [socket, mission?._id, activeMissionId]);

  // ── Also consume simulator context telemetry for map updates when sim is running ──
  useEffect(() => {
    if (!sim?.telemetry || !sim.running) return;
    const t = sim.telemetry;

    setTempHistory(prev => [...prev, t.temperature].slice(-20));

    setMission(prev => {
      if (!prev) return prev;
      const lat = t.lat ?? prev.currentLocation.lat;
      const lng = t.lng ?? prev.currentLocation.lng;
      const trail = [...(prev.trail || []), [lat, lng]];
      if (trail.length > 200) trail.shift();

      const healthStatus = t.spiked || t.tampered ? (t.temperature > 8 ? 'CRITICAL' : 'WARNING') : 'NORMAL';

      return {
        ...prev,
        currentLocation: { lat, lng },
        telemetry: {
          temperature: t.temperature,
          batteryLevel: t.batteryLevel,
          isTampered: t.tampered,
        },
        health: { status: healthStatus },
        trail,
      };
    });
    setLastUpdate(new Date());
  }, [sim?.telemetry, sim?.running]);

  // ─── Render: Loading ───
  if (loading) {
    return (
      <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--text-secondary)' }}>
          <div className={styles.spinning} style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.08)', borderTop: '3px solid #22d3a0', borderRadius: '50%' }} />
          <span>Loading transport missions…</span>
        </div>
      </div>
    );
  }

  // ─── Derived data ───
  const health = mission?.health || { status: 'NORMAL' };
  const telemetry = mission?.telemetry || { temperature: 4.0, batteryLevel: 100, isTampered: false };
  const currentLocation = mission?.currentLocation || { lat: 20.5937, lng: 78.9629 }; // India center fallback
  const trail = mission?.trail || [];
  const healthColor =
    health.status === 'CRITICAL' ? 'var(--status-critical)' :
    health.status === 'WARNING'  ? 'var(--status-warning)'  : 'var(--status-online)';

  const origin = mission?.originHospital ? {
    name: safeStr(mission.originHospital.name, 'Origin Hospital'),
    lat: mission.originHospital.geoLocation?.coordinates?.[1] || 0,
    lng: mission.originHospital.geoLocation?.coordinates?.[0] || 0,
  } : null;

  const dest = mission?.destinationHospital ? {
    name: safeStr(mission.destinationHospital.name, 'Destination Hospital'),
    lat: mission.destinationHospital.geoLocation?.coordinates?.[1] || 0,
    lng: mission.destinationHospital.geoLocation?.coordinates?.[0] || 0,
  } : null;

  // Map points for bounds fitting
  const boundsPoints = [
    origin && [origin.lat, origin.lng],
    dest && [dest.lat, dest.lng],
    mission && [currentLocation.lat, currentLocation.lng],
  ].filter(Boolean);

  // Build custody timeline
  const custodyEvents = [];
  if (mission) {
    const t0 = new Date(mission.createdAt || Date.now());
    custodyEvents.push({
      time: t0.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      event: 'Mission Created & Allocated',
      courier: 'Platform System',
      done: true,
    });
    if (mission.status === 'IN_TRANSIT' || mission.status === 'COMPLETED' || mission.status === 'DISPATCHED') {
      custodyEvents.push({
        time: new Date(mission.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: 'Dispatch Handover Verified',
        courier: 'Transport Team (RFID Tag Verified)',
        done: true,
      });
    } else {
      custodyEvents.push({ time: 'Pending', event: 'Dispatch Handover', courier: 'Transport Team', done: false });
    }
    if (mission.status === 'COMPLETED') {
      custodyEvents.push({
        time: new Date(mission.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        event: 'Recipient Handshake Verified',
        courier: 'Receiving Surgical Team',
        done: true,
      });
    } else {
      custodyEvents.push({ time: 'In Progress', event: 'Recipient Handshake', courier: 'Receiving Surgical Team', done: false });
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Live Transport Map</h1>
          <p className={styles.subtitle}>Real-time GPS tracking, IoT health monitoring & mission control</p>
        </div>
        <div className={styles.headerRight}>
          {lastUpdate && (
            <span className={styles.lastUpdate}>
              <RefreshCw size={11} /> {lastUpdate.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          )}
          {mission && (
            <span className={`badge ${health.status === 'CRITICAL' ? 'badge-danger' : health.status === 'WARNING' ? 'badge-warning' : 'badge-online'}`}>
              {health.status === 'CRITICAL' && <AlertTriangle size={10} />}
              {health.status === 'NORMAL' && <CheckCircle2 size={10} />}
              {health.status}
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Mission Switcher Bar ── */}
      {allMissions.length > 0 && (
        <motion.div className={styles.missionBar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {allMissions.map((m) => {
            const mid = m.missionId || m._id;
            const isActive = mid === activeMissionId;
            const sc = statusColor(m.status);
            return (
              <button
                key={mid}
                className={`${styles.missionTab} ${isActive ? styles.missionTabActive : ''}`}
                onClick={() => switchMission(m)}
              >
                <span className={styles.missionTabDot} style={{ background: sc, boxShadow: `0 0 6px ${sc}` }} />
                <span className={styles.missionTabId}>{safeStr(m.missionId, mid?.toString().slice(-8))}</span>
                <span className={styles.missionTabStatus} style={{ color: sc }}>{m.status || 'PENDING'}</span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* ── Main Layout: Map + Side Panel ── */}
      <div className={styles.layout}>
        {/* Map Area */}
        <div className={styles.mapWrap}>
          {!mission ? (
            <div className={styles.emptyMap}>
              <Truck size={48} style={{ opacity: 0.3 }} />
              <h3>No Transport Missions</h3>
              <p>Create a transport mission from the <strong>Data Entry Hub</strong> or the <strong>IoT Simulator</strong> page, then come back here to track it live.</p>
            </div>
          ) : (
            <MapContainer
              center={[currentLocation.lat, currentLocation.lng]}
              zoom={5}
              className={styles.map}
              zoomControl={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OSM &copy; CARTO'
                maxZoom={19}
              />

              {/* Auto-fit bounds */}
              <MapBounds points={boundsPoints} />

              {/* Planned route line (dashed) */}
              {origin && dest && (
                <Polyline
                  positions={[[origin.lat, origin.lng], [dest.lat, dest.lng]]}
                  color="rgba(255,255,255,0.1)"
                  weight={2}
                  dashArray="6,10"
                />
              )}

              {/* Actual trail (solid green) */}
              {trail.length > 1 && (
                <Polyline positions={trail} color="#22d3a0" weight={3} opacity={0.8} />
              )}

              {/* Origin marker */}
              {origin && (
                <Marker position={[origin.lat, origin.lng]} icon={HospitalIcon('#60a5fa')}>
                  <Popup><strong>Origin</strong><br />{origin.name}</Popup>
                </Marker>
              )}

              {/* Destination marker */}
              {dest && (
                <Marker position={[dest.lat, dest.lng]} icon={HospitalIcon('#a78bfa')}>
                  <Popup><strong>Destination</strong><br />{dest.name}</Popup>
                </Marker>
              )}

              {/* Moving box marker */}
              <Marker position={[currentLocation.lat, currentLocation.lng]} icon={makeBoxIcon(health.status)}>
                <Popup>
                  <strong>{safeStr(mission.boxId?.deviceId || mission.boxId, mission.missionId)}</strong><br />
                  Temp: {telemetry.temperature}°C<br />
                  Battery: {telemetry.batteryLevel}%<br />
                  Status: {health.status}
                </Popup>
              </Marker>

              {/* Alert radius when health not NORMAL */}
              {health.status !== 'NORMAL' && (
                <Circle
                  center={[currentLocation.lat, currentLocation.lng]}
                  radius={60000}
                  color={healthColor}
                  fillOpacity={0.04}
                  weight={1}
                />
              )}
            </MapContainer>
          )}

          {/* Simulator toggle button — always visible at bottom-left */}
          <button
            className={`${styles.simToggle} ${showSim ? styles.simToggleActive : ''}`}
            onClick={() => setShowSim(s => !s)}
          >
            <Cpu size={14} />
            {showSim ? 'Hide Simulator' : 'IoT Simulator'}
            {sim?.running && <span className="live-dot" />}
          </button>

          {/* Simulator overlay — always available */}
          <AnimatePresence>
            {showSim && <SimulatorOverlay onClose={() => setShowSim(false)} />}
          </AnimatePresence>
        </div>

        {/* ── Side Panel ── */}
        <div className={styles.sidePanel}>
          {mission ? (
            <>
              {/* Health Monitor Card */}
              <motion.div className={`glass-panel ${styles.card}`} layout>
                <div className={styles.cardHead}>
                  <Activity size={15} style={{ color: healthColor }} />
                  <h3>Health Monitor</h3>
                  <span style={{ marginLeft: 'auto' }}><span className="live-dot" /></span>
                </div>

                <div className={styles.healthBadge} style={{
                  background: `color-mix(in srgb,${healthColor} 12%,transparent)`,
                  borderColor: `color-mix(in srgb,${healthColor} 40%,transparent)`,
                  color: healthColor,
                }}>
                  {health.status === 'CRITICAL' && <AlertTriangle size={15} />}
                  {health.status === 'NORMAL' && <CheckCircle2 size={15} />}
                  {health.status === 'WARNING' && <AlertTriangle size={15} />}
                  {health.status}
                </div>

                <div className={styles.metrics}>
                  {/* Temperature */}
                  <div className={styles.metric}>
                    <div className={styles.metricLeft}>
                      <Thermometer size={15} style={{
                        color: telemetry.temperature > 8 ? 'var(--status-critical)' :
                               telemetry.temperature > 6 ? 'var(--status-warning)' : 'var(--brand-blue)',
                      }} />
                      <span className={styles.metricLabel}>Temperature</span>
                    </div>
                    <span className={styles.metricVal} style={{
                      color: telemetry.temperature > 8 ? 'var(--status-critical)' : 'var(--text-primary)',
                    }}>{telemetry.temperature}°C</span>
                  </div>
                  <div className={styles.metricBar}>
                    <motion.div
                      className={styles.metricBarFill}
                      style={{ background: telemetry.temperature > 8 ? 'var(--status-critical)' : 'var(--brand-blue)' }}
                      animate={{ width: `${Math.min((telemetry.temperature / 12) * 100, 100)}%` }}
                      transition={{ type: 'spring', stiffness: 80 }}
                    />
                  </div>

                  {/* Temperature Sparkline */}
                  <div style={{ padding: '5px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '3px' }}>
                      <span>Temp History</span>
                      <span className="mono">{telemetry.temperature}°C</span>
                    </div>
                    <svg width="100%" height="28" viewBox="0 0 150 28" style={{ overflow: 'visible' }}>
                      {(() => {
                        const minT = 0, maxT = 10;
                        const pts = tempHistory.map((val, idx) => {
                          const x = (idx / Math.max(1, tempHistory.length - 1)) * 150;
                          const y = 28 - ((val - minT) / (maxT - minT)) * 28;
                          return `${x},${Math.max(2, Math.min(26, y))}`;
                        }).join(' ');
                        return (
                          <>
                            <polyline points={pts} fill="none" stroke="var(--brand-blue)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            {tempHistory.map((val, idx) => {
                              const x = (idx / Math.max(1, tempHistory.length - 1)) * 150;
                              const y = 28 - ((val - minT) / (maxT - minT)) * 28;
                              return <circle key={idx} cx={x} cy={Math.max(2, Math.min(26, y))} r="2" fill={val > 8 ? '#f87171' : 'var(--brand-green)'} />;
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  {/* Battery */}
                  <div className={styles.metric}>
                    <div className={styles.metricLeft}>
                      <Battery size={15} style={{ color: telemetry.batteryLevel < 20 ? 'var(--status-critical)' : 'var(--brand-green)' }} />
                      <span className={styles.metricLabel}>Battery</span>
                    </div>
                    <span className={styles.metricVal}>{telemetry.batteryLevel}%</span>
                  </div>
                  <div className={styles.metricBar}>
                    <motion.div
                      className={styles.metricBarFill}
                      style={{ background: telemetry.batteryLevel < 20 ? 'var(--status-critical)' : 'var(--brand-green)' }}
                      animate={{ width: `${telemetry.batteryLevel}%` }}
                      transition={{ type: 'spring', stiffness: 80 }}
                    />
                  </div>

                  {/* Tamper Alert */}
                  <AnimatePresence>
                    {telemetry.isTampered && (
                      <motion.div className={styles.tamperAlert} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                        <AlertTriangle size={13} /> TAMPER DETECTED
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Mission Details Card */}
              <div className={`glass-panel ${styles.card}`}>
                <div className={styles.cardHead}>
                  <MapPin size={15} style={{ color: 'var(--brand-purple)' }} />
                  <h3>Mission Details</h3>
                </div>
                <div className={styles.missionInfo}>
                  <div className={styles.infoRow}><span>Mission ID</span><span className="mono">{safeStr(mission.missionId, mission._id)}</span></div>
                  <div className={styles.infoRow}><span>Status</span><span className="mono" style={{ color: statusColor(mission.status) }}>{mission.status}</span></div>
                  <div className={styles.infoRow}><span>Box ID</span><span className="mono">{safeStr(mission.boxId?.deviceId || mission.boxId, '—')}</span></div>
                </div>
                {(origin || dest) && (
                  <div className={styles.route}>
                    {origin && (
                      <div className={styles.routePoint}>
                        <div className={styles.routeDot} style={{ background: '#60a5fa' }} />
                        <div><div className={styles.routeLabel}>Origin</div><div className={styles.routeName}>{origin.name}</div></div>
                      </div>
                    )}
                    <div className={styles.routeConnector} />
                    {dest && (
                      <div className={styles.routePoint}>
                        <div className={styles.routeDot} style={{ background: '#a78bfa' }} />
                        <div><div className={styles.routeLabel}>Destination</div><div className={styles.routeName}>{dest.name}</div></div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* RFID Custody Chain */}
              <div className={`glass-panel ${styles.card}`}>
                <div className={styles.cardHead}>
                  <Activity size={15} style={{ color: 'var(--brand-amber)' }} />
                  <h3>RFID Custody Chain</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {custodyEvents.map((evt, idx) => (
                    <div key={idx} className={`${styles.custodyStep} ${evt.done ? styles.custodyCompleted : styles.custodyPending}`}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.72rem' }}>{evt.event}</div>
                        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.65rem' }}>{evt.courier}</div>
                      </div>
                      <span className="mono" style={{ fontSize: '0.65rem', color: evt.done ? '#22d3a0' : '#fbbf24' }}>{evt.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* GPS Coordinates */}
              <div className={`glass-panel ${styles.card}`}>
                <div className={styles.cardHead}>
                  <Navigation size={15} style={{ color: 'var(--brand-green)' }} />
                  <h3>GPS Coordinates</h3>
                </div>
                <div className={`mono ${styles.gpsDisplay}`}>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>LAT</span>  {currentLocation.lat.toFixed(5)}°N</div>
                  <div><span style={{ color: 'var(--text-tertiary)' }}>LNG</span>  {currentLocation.lng.toFixed(5)}°E</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '4px' }}>
                    {sim?.running ? '↑ Via IoT Simulator' : '↑ Via Socket.IO / ESP32 stream'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={`glass-panel ${styles.card}`} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
              <MapPin size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <p style={{ fontSize: '0.85rem' }}>Select or create a mission to view telemetry data</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransportMap;
