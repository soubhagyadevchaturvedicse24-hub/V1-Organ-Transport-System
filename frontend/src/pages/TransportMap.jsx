import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Thermometer, Battery, Navigation,
  AlertTriangle, CheckCircle2, MapPin, Clock, RefreshCw
} from 'lucide-react';
import { getLiveMission } from '../services/api';
import { useSocket } from '../context/SocketContext';
import styles from './TransportMap.module.css';

// Fix Leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

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

const TransportMap = () => {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [tempHistory, setTempHistory] = useState([4.0, 4.1, 3.9, 4.2, 4.0, 4.3, 4.1]);
  const socket = useSocket();

  useEffect(() => {
    // Fetch initial state
    getLiveMission()
      .then(data => {
        if (data) {
          // Determine initial location from chain of custody or origin
          let initialLoc = { lat: 0, lng: 0 };
          const trail = [];
          if (data.originHospital && data.originHospital.geoLocation) {
            initialLoc = {
              lat: data.originHospital.geoLocation.coordinates[1],
              lng: data.originHospital.geoLocation.coordinates[0]
            };
            trail.push([initialLoc.lat, initialLoc.lng]);
          }

          if (data.chainOfCustody && data.chainOfCustody.length > 0) {
            // Find last point
            const lastPoint = [...data.chainOfCustody].reverse().find(e => e.location && e.location.coordinates);
            if (lastPoint) {
              initialLoc = {
                lat: lastPoint.location.coordinates[1],
                lng: lastPoint.location.coordinates[0]
              };
            }
            // Populate trail
            data.chainOfCustody.forEach(evt => {
              if (evt.location && evt.location.coordinates) {
                trail.push([evt.location.coordinates[1], evt.location.coordinates[0]]);
              }
            });
          }

          setMission({
            ...data,
            currentLocation: initialLoc,
            telemetry: { temperature: 4.0, batteryLevel: 100, isTampered: false }, // Default, waiting for telemetry
            trail
          });
          setLastUpdate(new Date());
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket || !mission) return;

    socket.emit('join_mission', mission._id);

    socket.on('transport:telemetry', (payload) => {
      if (payload.missionId === mission._id) {
        if (payload.temperature !== undefined) {
          setTempHistory(prev => [...prev, payload.temperature].slice(-15));
        }

        setMission(prev => {
          const lat = payload.location.coordinates[1];
          const lng = payload.location.coordinates[0];
          const trail = [...prev.trail, [lat, lng]];
          // Keep trail max length
          if (trail.length > 200) trail.shift();
          
          return {
            ...prev,
            currentLocation: { lat, lng },
            telemetry: {
              temperature: payload.temperature,
              batteryLevel: payload.batteryLevel,
              isTampered: payload.isTampered
            },
            trail
          };
        });
        setLastUpdate(new Date());
      }
    });

    socket.on('transport:health_change', (payload) => {
      if (payload.missionId === mission._id) {
        setMission(prev => ({
          ...prev,
          health: payload.health
        }));
      }
    });

    return () => {
      socket.off('transport:telemetry');
      socket.off('transport:health_change');
      socket.emit('leave_mission', mission._id);
    };
  }, [socket, mission?._id]);

  if (loading) {
    return <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading live tracking data...</div>;
  }

  if (!mission) {
    return <div className={styles.page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No active transport missions found.</div>;
  }

  const { health, telemetry, currentLocation, trail } = mission;
  const healthColor =
    health.status === 'CRITICAL' ? 'var(--status-critical)' :
    health.status === 'WARNING'  ? 'var(--status-warning)'  : 'var(--status-online)';

  const origin = mission.originHospital ? {
    name: mission.originHospital.name,
    lat: mission.originHospital.geoLocation.coordinates[1],
    lng: mission.originHospital.geoLocation.coordinates[0]
  } : { name: 'Unknown', lat: 0, lng: 0 };

  const dest = mission.destinationHospital ? {
    name: mission.destinationHospital.name,
    lat: mission.destinationHospital.geoLocation.coordinates[1],
    lng: mission.destinationHospital.geoLocation.coordinates[0]
  } : { name: 'Unknown', lat: 0, lng: 0 };

  return (
    <div className={styles.page}>
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
        <div className={styles.mapWrap}>
          <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={5} className={styles.map} zoomControl={true}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; OSM &copy; CARTO' maxZoom={19} />
            <MapPanner pos={[currentLocation.lat, currentLocation.lng]} />
            <Polyline positions={[[origin.lat, origin.lng], [dest.lat, dest.lng]]} color="rgba(255,255,255,0.12)" weight={2} dashArray="6,10" />
            
            {trail.length > 1 && <Polyline positions={trail} color="var(--brand-green)" weight={3} opacity={0.85} />}
            
            <Marker position={[origin.lat, origin.lng]} icon={HospitalIcon('#60a5fa')}>
              <Popup><strong>Origin</strong><br />{origin.name}</Popup>
            </Marker>
            <Marker position={[dest.lat, dest.lng]} icon={HospitalIcon('#a78bfa')}>
              <Popup><strong>Destination</strong><br />{dest.name}</Popup>
            </Marker>
            
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={makeBoxIcon(health.status)}>
              <Popup>
                <strong>{mission.boxId?.deviceId || mission.missionId}</strong><br />
                Temp: {telemetry.temperature}°C<br />
                Battery: {telemetry.batteryLevel}%<br />
              </Popup>
            </Marker>
            
            {health.status !== 'NORMAL' && (
              <Circle center={[currentLocation.lat, currentLocation.lng]} radius={60000} color={healthColor} fillOpacity={0.04} weight={1} />
            )}
          </MapContainer>
        </div>

        <div className={styles.sidePanel}>
          <motion.div className={`glass-panel ${styles.card}`} layout>
            <div className={styles.cardHead}>
              <Activity size={16} style={{ color: healthColor }} />
              <h3>Health Monitor</h3>
              <span style={{ marginLeft:'auto' }}><span className="live-dot" /></span>
            </div>

            <div className={styles.healthBadge} style={{ background:`color-mix(in srgb,${healthColor} 12%,transparent)`, borderColor:`color-mix(in srgb,${healthColor} 40%,transparent)`, color: healthColor }}>
              {health.status === 'CRITICAL' && <AlertTriangle size={16} />}
              {health.status === 'NORMAL'   && <CheckCircle2 size={16} />}
              {health.status}
            </div>

            <div className={styles.metrics}>
              <div className={styles.metric}>
                <div className={styles.metricLeft}>
                  <Thermometer size={16} style={{ color: telemetry.temperature > 8 ? 'var(--status-critical)' : telemetry.temperature > 6 ? 'var(--status-warning)' : 'var(--brand-blue)' }} />
                  <span className={styles.metricLabel}>Temperature</span>
                </div>
                <span className={styles.metricVal} style={{ color: telemetry.temperature > 8 ? 'var(--status-critical)' : 'var(--text-primary)' }}>{telemetry.temperature}°C</span>
              </div>
              <div className={styles.metricBar}>
                <motion.div className={styles.metricBarFill} style={{ background: telemetry.temperature > 8 ? 'var(--status-critical)' : 'var(--brand-blue)' }} animate={{ width: `${Math.min((telemetry.temperature / 12) * 100, 100)}%` }} transition={{ type: 'spring', stiffness: 80 }} />
              </div>

              {/* Temperature Sparkline */}
              <div style={{ marginTop: '8px', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                  <span>Temp History (Live Sparkline)</span>
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
                        <polyline points={pts} fill="none" stroke="var(--brand-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        {tempHistory.map((val, idx) => {
                          const x = (idx / Math.max(1, tempHistory.length - 1)) * 150;
                          const y = 28 - ((val - minT) / (maxT - minT)) * 28;
                          return <circle key={idx} cx={x} cy={Math.max(2, Math.min(26, y))} r="2.5" fill={val > 8 ? '#f87171' : 'var(--brand-green)'} />;
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <div className={styles.metric}>
                <div className={styles.metricLeft}>
                  <Battery size={16} style={{ color: telemetry.batteryLevel < 20 ? 'var(--status-critical)' : 'var(--brand-green)' }} />
                  <span className={styles.metricLabel}>Battery</span>
                </div>
                <span className={styles.metricVal}>{telemetry.batteryLevel}%</span>
              </div>
              <div className={styles.metricBar}>
                <motion.div className={styles.metricBarFill} style={{ background: telemetry.batteryLevel < 20 ? 'var(--status-critical)' : 'var(--brand-green)' }} animate={{ width: `${telemetry.batteryLevel}%` }} transition={{ type: 'spring', stiffness: 80 }} />
              </div>

              <AnimatePresence>
                {telemetry.isTampered && (
                  <motion.div className={styles.tamperAlert} initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}>
                    <AlertTriangle size={14} /> TAMPER DETECTED
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className={`glass-panel ${styles.card}`}>
            <div className={styles.cardHead}>
              <MapPin size={16} style={{ color:'var(--brand-purple)' }} />
              <h3>Mission Details</h3>
            </div>
            <div className={styles.missionInfo}>
              <div className={styles.infoRow}><span>Mission ID</span><span className="mono">{mission.missionId}</span></div>
              <div className={styles.infoRow}><span>Status</span><span className="mono" style={{ color:'var(--brand-green)' }}>{mission.status}</span></div>
            </div>
            <div className={styles.route}>
              <div className={styles.routePoint}>
                <div className={styles.routeDot} style={{ background:'#60a5fa' }} />
                <div><div className={styles.routeLabel}>Origin</div><div className={styles.routeName}>{origin.name}</div></div>
              </div>
              <div className={styles.routeConnector} />
              <div className={styles.routePoint}>
                <div className={styles.routeDot} style={{ background:'#a78bfa' }} />
                <div><div className={styles.routeLabel}>Destination</div><div className={styles.routeName}>{dest.name}</div></div>
              </div>
            </div>
          </div>

          {/* RFID Chain of Custody Timeline */}
          <div className={`glass-panel ${styles.card}`}>
            <div className={styles.cardHead}>
              <Activity size={16} style={{ color:'var(--brand-amber)' }} />
              <h3>RFID Custody Chain</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
              {(() => {
                const events = [];
                const t0 = new Date(mission.createdAt || Date.now());
                
                events.push({
                  time: t0.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  event: 'Mission Created & Allocated',
                  courier: 'Platform Automated System',
                  status: 'COMPLETED'
                });

                if (mission.status === 'IN_TRANSIT' || mission.status === 'COMPLETED') {
                  const t1 = new Date(mission.updatedAt || Date.now());
                  events.push({
                    time: t1.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    event: 'Dispatch Handover Verified',
                    courier: 'Transport Team (RFID Tag Verified)',
                    status: 'COMPLETED'
                  });
                } else {
                  events.push({ time: 'Pending', event: 'Dispatch Handover', courier: 'Transport Team', status: 'PENDING' });
                }

                if (mission.status === 'COMPLETED') {
                  const t2 = new Date(mission.updatedAt || Date.now());
                  events.push({
                    time: t2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    event: 'Recipient Handshake Verified',
                    courier: 'Receiving Surgical Team',
                    status: 'COMPLETED'
                  });
                } else {
                  events.push({ time: 'In Progress', event: 'Recipient Handshake', courier: 'Receiving Surgical Team', status: 'PENDING' });
                }

                return events.map((evt, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', padding: '6px 8px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: evt.status === 'COMPLETED' ? '3px solid #22d3a0' : '3px solid #fbbf24' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{evt.event}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: '0.68rem' }}>{evt.courier}</div>
                    </div>
                    <span className="mono" style={{ fontSize: '0.68rem', color: evt.status === 'COMPLETED' ? '#22d3a0' : '#fbbf24' }}>{evt.time}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className={`glass-panel ${styles.card}`}>
            <div className={styles.cardHead}>
              <Navigation size={16} style={{ color:'var(--brand-green)' }} />
              <h3>GPS Coordinates</h3>
            </div>
            <div className={`mono ${styles.gpsDisplay}`}>
              <div><span style={{ color:'var(--text-tertiary)' }}>LAT</span>  {currentLocation.lat.toFixed(5)}°N</div>
              <div><span style={{ color:'var(--text-tertiary)' }}>LNG</span>  {currentLocation.lng.toFixed(5)}°E</div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.72rem', marginTop:'var(--sp-2)' }}>Updated via IoT Stream</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportMap;
