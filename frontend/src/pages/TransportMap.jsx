import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Thermometer, Battery, Navigation, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-react';
import { getLiveMission } from '../services/api';
import styles from './TransportMap.module.css';

// Fix leaflet icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getBoxIcon = (status) => {
  const color = status === 'CRITICAL' ? '#ef4444' : status === 'WARNING' ? '#f59e0b' : '#10b981';
  return new L.DivIcon({
    className: styles.customIcon,
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px ${color};"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const TrendIcon = ({ trend }) => {
  if (trend === 'increasing') return <ArrowUpRight size={16} className={styles.trendUp} />;
  if (trend === 'decreasing') return <ArrowDownRight size={16} className={styles.trendDown} />;
  return <Minus size={16} className={styles.trendStable} />;
};

const TransportMap = () => {
  const [mission, setMission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLiveMission().then(setMission).finally(() => setLoading(false));
    
    // Simulate live movement
    const interval = setInterval(() => {
      setMission(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentLocation: {
            lat: prev.currentLocation.lat - 0.05,
            lng: prev.currentLocation.lng - 0.05
          },
          telemetry: {
            ...prev.telemetry,
            temperature: (prev.telemetry.temperature + (Math.random() * 0.2 - 0.1)).toFixed(1),
            battery: Math.max(0, prev.telemetry.battery - 0.1).toFixed(1)
          }
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className="gradient-text">Live Transport Map</h1>
        <p className={styles.subtitle}>Real-time IoT telemetry and GPS tracking</p>
      </div>

      {loading ? (
        <div className={styles.loader}>Initializing connection to transport boxes...</div>
      ) : !mission ? (
        <div className={styles.emptyState}>No active transport missions found.</div>
      ) : (
        <div className={styles.layout}>
          
          <div className={styles.mapWrapper}>
            <MapContainer 
              center={[23.5, 75.0]} 
              zoom={5} 
              className={styles.map}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
              />
              
              <Marker position={[mission.origin.lat, mission.origin.lng]}>
                <Popup>Origin: {mission.origin.name}</Popup>
              </Marker>
              
              <Marker position={[mission.destination.lat, mission.destination.lng]}>
                <Popup>Destination: {mission.destination.name}</Popup>
              </Marker>

              <Marker 
                position={[mission.currentLocation.lat, mission.currentLocation.lng]}
                icon={getBoxIcon(mission.health.status)}
              >
                <Popup className={styles.darkPopup}>
                  <strong>{mission.boxId}</strong><br/>
                  ETA: {mission.telemetry.eta}
                </Popup>
              </Marker>

              <Polyline 
                positions={[
                  [mission.origin.lat, mission.origin.lng],
                  [mission.destination.lat, mission.destination.lng]
                ]} 
                color="rgba(255, 255, 255, 0.2)"
                dashArray="5, 10"
              />
              
              <Polyline 
                positions={[
                  [mission.origin.lat, mission.origin.lng],
                  [mission.currentLocation.lat, mission.currentLocation.lng]
                ]} 
                color="var(--accent-primary)"
                weight={3}
              />
            </MapContainer>
          </div>

          <div className={styles.sidePanel}>
            <div className={`${styles.healthCard} glass-panel`}>
              <div className={styles.cardHeader}>
                <Activity size={20} className={styles.icon} />
                <h3>Health Monitor</h3>
              </div>
              
              <div className={`${styles.statusBadge} ${styles[mission.health.status.toLowerCase()]}`}>
                {mission.health.status === 'CRITICAL' && <AlertTriangle size={16} />}
                {mission.health.status}
              </div>
              
              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <Thermometer size={18} className={styles.metricIcon} />
                  <div className={styles.metricData}>
                    <span className={styles.metricLabel}>Temperature</span>
                    <div className={styles.metricValue}>
                      {mission.telemetry.temperature}°C
                      <TrendIcon trend={mission.telemetry.tempTrend} />
                    </div>
                  </div>
                </div>
                
                <div className={styles.metric}>
                  <Battery size={18} className={styles.metricIcon} />
                  <div className={styles.metricData}>
                    <span className={styles.metricLabel}>Battery</span>
                    <div className={styles.metricValue}>
                      {mission.telemetry.battery}%
                      <TrendIcon trend={mission.telemetry.batteryTrend} />
                    </div>
                  </div>
                </div>
                
                <div className={styles.metric}>
                  <Navigation size={18} className={styles.metricIcon} />
                  <div className={styles.metricData}>
                    <span className={styles.metricLabel}>ETA</span>
                    <div className={styles.metricValue}>{mission.telemetry.eta}</div>
                  </div>
                </div>
              </div>

              {mission.health.reasons && mission.health.reasons.length > 0 && (
                <div className={styles.healthReasons}>
                  <h4>Alerts</h4>
                  <ul>
                    {mission.health.reasons.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
            
            <div className={`${styles.missionInfo} glass-panel`}>
              <h3>Mission Details</h3>
              <p><strong>ID:</strong> {mission.id}</p>
              <p><strong>Box:</strong> {mission.boxId}</p>
              <div className={styles.routeInfo}>
                <div className={styles.routePoint}>
                  <div className={styles.routeDot}></div>
                  <span>{mission.origin.name}</span>
                </div>
                <div className={styles.routeLine}></div>
                <div className={styles.routePoint}>
                  <div className={styles.routeDot} style={{backgroundColor: 'var(--accent-secondary)'}}></div>
                  <span>{mission.destination.name}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportMap;
