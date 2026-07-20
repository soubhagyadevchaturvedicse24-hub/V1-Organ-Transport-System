import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Thermometer, Battery, Navigation,
  AlertTriangle, CheckCircle2, MapPin, Clock, RefreshCw
} from 'lucide-react';
import styles from './TransportMap.module.css';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ORIGIN      = { name: 'AIIMS New Delhi',        lat: 28.5659, lng: 77.2090 };
const DESTINATION = { name: 'Tata Memorial, Mumbai',  lat: 19.0069, lng: 72.8427 };

/* SVG-based custom icon for moving box */
const makeBoxIcon = (status) => {
  const col = status === 'CRITICAL' ? '#f87171' : status === 'WARNING' ? '#fbbf24' : '#22d3a0';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="14" fill="${col}" opacity="0.2"/>
    <circle cx="16" cy="16" r="9"  fill="${col}" stroke="white" stroke-width="2.5"/>
    <circle cx="16" cy="16" r="3"  fill="white"/>
  </svg>`;
  return new L.DivIcon({
    html: svg,
    className: '',
    iconSize:   [32, 32],
    iconAnchor: [16, 16],
  });
};

const HospitalIcon = (color) => new L.DivIcon({
  html: `<div style="width:14px;height:14px;border-radius:3px;background:${color};border:2px solid white;box-shadow:0 0 8px ${color};"></div>`,
  className: '',
  iconSize:   [14, 14],
  iconAnchor: [7, 7],
});

/* Auto-pan map to current box location */
const MapPanner = ({ pos }) => {
  const map = useMap();
  useEffect(() => { if (pos) map.setView(pos, undefined, { animate: true, duration: 1 }); }, [pos, map]);
  return null;
};

/* Compute ETA string based on remaining distance */
const calcETA = (lat, lng) => {
  const dLat = DESTINATION.lat - lat;
  const dLng = DESTINATION.lng - lng;
  const dist  = Math.sqrt(dLat**2 + dLng**2) * 111; // km approx
  const hrs   = Math.round(dist / 800);              // ~800 km/h analogy
  return `~${hrs}h ETA`;
};

const TransportMap = () => {
  const [mission, setMission] = useState({
    id:     'TRN-2026-001',
    boxId:  'BOX-2026-001',
    health: { status: 'NORMAL' },
    telemetry: {
      temperature: 4.0,
      batteryLevel: 100,
      isTampered: false,
    },
    currentLocation: { lat: 28.5659, lng: 77.2090 },
    trail: [],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const tickRef = useRef(null);

  /* Simulate progressive movement toward destination */
  useEffect(() => {
    let lat = 28.5659, lng = 77.2090;
    let battery = 100;
    let temp    = 4.0;
    const trail = [[lat, lng]];

    const step = () => {
      const dLat = DESTINATION.lat - lat;
      const dLng = DESTINATION.lng - lng;
      const dist  = Math.sqrt(dLat**2 + dLng**2);

      if (dist > 0.05) {
        lat += (dLat / dist) * 0.06;
        lng += (dLng / dist) * 0.06;
      }

      // Random anomalies
      const spiked   = Math.random() < 0.05;
      const tampered = Math.random() < 0.01;
      temp     = spiked ? 8.5 + Math.random() * 2 : Math.max(3.5, temp + (Math.random() * 0.3 - 0.15));
      battery  = Math.max(0, battery - 0.25);

      const health =
        tampered || temp > 8.0 ? 'CRITICAL' :
        temp > 6.0 || battery < 30 ? 'WARNING' : 'NORMAL';

      trail.push([lat, lng]);
      if (trail.length > 80) trail.shift();

      setMission({
        id:     'TRN-2026-001',
        boxId:  'BOX-2026-001',
        health: { status: health },
        telemetry: {
          temperature:  parseFloat(temp.toFixed(2)),
          batteryLevel: parseFloat(battery.toFixed(1)),
          isTampered:   tampered,
        },
        currentLocation: { lat, lng },
        trail:           [...trail],
        eta:             calcETA(lat, lng),
      });
      setLastUpdate(new Date());
    };

    step();
    tickRef.current = setInterval(step, 3500);
    return () => clearInterval(tickRef.current);
  }, []);

  const { health, telemetry, currentLocation, trail, eta } = mission;
  const healthColor =
    health.status === 'CRITICAL' ? 'var(--status-critical)' :
    health.status === 'WARNING'  ? 'var(--status-warning)'  : 'var(--status-online)';

  return (
    <div className={styles.page}>
      {/* Header */}
      <motion.div className={styles.header} initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
        <div>
          <h1 className={`gradient-text ${styles.title}`}>Live Transport Map</h1>
          <p className={styles.subtitle}>Real-time GPS tracking & IoT health monitoring</p>
        </div>
        <div className={styles.headerRight}>
          {lastUpdate && (
            <span className={styles.lastUpdate}>
              <RefreshCw size={11} /> {lastUpdate.toLocaleTimeString('en-IN', { hour12:false })}
            </span>
          )}
          <span className={`badge ${health.status === 'CRITICAL' ? 'badge-danger' : health.status === 'WARNING' ? 'badge-warning' : 'badge-online'}`}>
            {health.status === 'CRITICAL' && <AlertTriangle size={10} />}
            {health.status === 'NORMAL'   && <CheckCircle2 size={10} />}
            {health.status}
          </span>
        </div>
      </motion.div>

      <div className={styles.layout}>
        {/* MAP */}
        <div className={styles.mapWrap}>
          <MapContainer
            center={[23.5, 75.5]}
            zoom={5}
            className={styles.map}
            zoomControl={true}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; OSM &copy; CARTO'
              maxZoom={19}
            />

            <MapPanner pos={[currentLocation.lat, currentLocation.lng]} />

            {/* Route line */}
            <Polyline
              positions={[[ORIGIN.lat, ORIGIN.lng], [DESTINATION.lat, DESTINATION.lng]]}
              color="rgba(255,255,255,0.12)"
              weight={2}
              dashArray="6,10"
            />

            {/* Completed path */}
            {trail.length > 1 && (
              <Polyline
                positions={trail}
                color="var(--brand-green)"
                weight={3}
                opacity={0.85}
              />
            )}

            {/* Origin */}
            <Marker position={[ORIGIN.lat, ORIGIN.lng]} icon={HospitalIcon('#60a5fa')}>
              <Popup>
                <strong>Origin</strong><br />{ORIGIN.name}
              </Popup>
            </Marker>

            {/* Destination */}
            <Marker position={[DESTINATION.lat, DESTINATION.lng]} icon={HospitalIcon('#a78bfa')}>
              <Popup>
                <strong>Destination</strong><br />{DESTINATION.name}
              </Popup>
            </Marker>

            {/* Moving box */}
            <Marker
              position={[currentLocation.lat, currentLocation.lng]}
              icon={makeBoxIcon(health.status)}
            >
              <Popup>
                <strong>{mission.boxId}</strong><br />
                Temp: {telemetry.temperature}°C<br />
                Battery: {telemetry.batteryLevel}%<br />
                {eta}
              </Popup>
            </Marker>

            {/* Alert radius when critical */}
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
        </div>

        {/* SIDE PANEL */}
        <div className={styles.sidePanel}>
          {/* Health Card */}
          <motion.div className={`glass-panel ${styles.card}`} layout>
            <div className={styles.cardHead}>
              <Activity size={16} style={{ color: healthColor }} />
              <h3>Health Monitor</h3>
              <span style={{ marginLeft:'auto' }}>
                <span className="live-dot" />
              </span>
            </div>

            <div className={styles.healthBadge} style={{ background:`color-mix(in srgb,${healthColor} 12%,transparent)`, borderColor:`color-mix(in srgb,${healthColor} 40%,transparent)`, color: healthColor }}>
              {health.status === 'CRITICAL' && <AlertTriangle size={16} />}
              {health.status === 'NORMAL'   && <CheckCircle2 size={16} />}
              {health.status}
            </div>

            <div className={styles.metrics}>
              {/* Temperature */}
              <div className={styles.metric}>
                <div className={styles.metricLeft}>
                  <Thermometer size={16} style={{ color: telemetry.temperature > 8 ? 'var(--status-critical)' : telemetry.temperature > 6 ? 'var(--status-warning)' : 'var(--brand-blue)' }} />
                  <span className={styles.metricLabel}>Temperature</span>
                </div>
                <span className={styles.metricVal} style={{ color: telemetry.temperature > 8 ? 'var(--status-critical)' : 'var(--text-primary)' }}>
                  {telemetry.temperature}°C
                </span>
              </div>
              <div className={styles.metricBar}>
                <motion.div
                  className={styles.metricBarFill}
                  style={{ background: telemetry.temperature > 8 ? 'var(--status-critical)' : 'var(--brand-blue)' }}
                  animate={{ width: `${Math.min((telemetry.temperature / 12) * 100, 100)}%` }}
                  transition={{ type: 'spring', stiffness: 80 }}
                />
              </div>

              {/* Battery */}
              <div className={styles.metric}>
                <div className={styles.metricLeft}>
                  <Battery size={16} style={{ color: telemetry.batteryLevel < 20 ? 'var(--status-critical)' : 'var(--brand-green)' }} />
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

              {/* Tamper */}
              <AnimatePresence>
                {telemetry.isTampered && (
                  <motion.div
                    className={styles.tamperAlert}
                    initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                  >
                    <AlertTriangle size={14} /> TAMPER DETECTED
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Mission Info */}
          <div className={`glass-panel ${styles.card}`}>
            <div className={styles.cardHead}>
              <MapPin size={16} style={{ color:'var(--brand-purple)' }} />
              <h3>Mission Details</h3>
            </div>

            <div className={styles.missionInfo}>
              <div className={styles.infoRow}><span>Mission ID</span><span className="mono">{mission.id}</span></div>
              <div className={styles.infoRow}><span>Transport Box</span><span className="mono">{mission.boxId}</span></div>
              <div className={styles.infoRow}><span>ETA</span><span style={{ color:'var(--brand-amber)' }}>{eta}</span></div>
            </div>

            <div className={styles.route}>
              <div className={styles.routePoint}>
                <div className={styles.routeDot} style={{ background:'#60a5fa' }} />
                <div>
                  <div className={styles.routeLabel}>Origin</div>
                  <div className={styles.routeName}>{ORIGIN.name}</div>
                </div>
              </div>
              <div className={styles.routeConnector} />
              <div className={styles.routePoint}>
                <div className={styles.routeDot} style={{ background:'#a78bfa' }} />
                <div>
                  <div className={styles.routeLabel}>Destination</div>
                  <div className={styles.routeName}>{DESTINATION.name}</div>
                </div>
              </div>
            </div>
          </div>

          {/* GPS */}
          <div className={`glass-panel ${styles.card}`}>
            <div className={styles.cardHead}>
              <Navigation size={16} style={{ color:'var(--brand-green)' }} />
              <h3>GPS Coordinates</h3>
            </div>
            <div className={`mono ${styles.gpsDisplay}`}>
              <div><span style={{ color:'var(--text-tertiary)' }}>LAT</span>  {currentLocation.lat.toFixed(5)}°N</div>
              <div><span style={{ color:'var(--text-tertiary)' }}>LNG</span>  {currentLocation.lng.toFixed(5)}°E</div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.72rem', marginTop:'var(--sp-2)' }}>
                Updated every 3.5s
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportMap;
