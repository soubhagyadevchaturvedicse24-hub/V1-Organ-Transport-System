import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const SimulatorContext = createContext(null);

const defaults = {
  boxId:       'BOX-2026-FABRIC-ALPHA',
  deviceSecret:'secret123',
  missionId:   'TRN-2026-001',
  interval:    5,        // seconds
  tempTarget:  4.0,      // target temperature
  tempSpike:   0.0,      // NO automatic random temp spikes (user controlled only)
  tamperChance:0.0,      // NO automatic random lid open (user controlled only)
  batteryDrain:0.0,      // NO automatic battery drain (user controlled only)
  startLat:    28.5659,
  startLng:    77.2090,
};

export const SimulatorProvider = ({ children }) => {
  const [cfg, setCfg] = useState({ ...defaults });
  const [running,  setRunning]  = useState(false);
  const [telemetry,setTelemetry]= useState(null);
  const [logs,     setLogs]     = useState([]);
  const [ticks,    setTicks]    = useState(0);
  const [connected,setConnected]= useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [isTamperedMode, setIsTamperedMode] = useState(false);

  // States to drive slider inputs instantly without lag
  const [currentTemp, setCurrentTemp] = useState(defaults.tempTarget);
  const [currentBattery, setCurrentBattery] = useState(100);

  const state = useRef({
    temp:    cfg.tempTarget,
    battery: 100,
    lat:     cfg.startLat,
    lng:     cfg.startLng,
    isManual: false,
    isTampered: false,
  });

  // Keep state ref in sync when config changes
  useEffect(() => {
    state.current.temp = cfg.tempTarget;
    state.current.lat = cfg.startLat;
    state.current.lng = cfg.startLng;
    setCurrentTemp(cfg.tempTarget);
  }, [cfg]);

  const addLog = useCallback((type, msg) => {
    setLogs(prev => [{
      id:   Date.now() + Math.random(),
      type,
      msg,
      ts:   new Date().toLocaleTimeString('en-IN', { hour12:false }),
    }, ...prev].slice(0, 200));
  }, []);

  const tick = useCallback(async () => {
    const s = state.current;
    
    // Completely deterministic - temperature, battery, tamper strictly follow state ref
    const spiked = s.temp > 8.0 || s.temp < 2.0;
    const tampered = s.isTampered || false;

    // Update UI state representations
    setCurrentTemp(parseFloat(s.temp.toFixed(2)));
    setCurrentBattery(parseFloat(s.battery.toFixed(1)));

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

    setTelemetry({ ...payload, lat: s.lat, lng: s.lng, spiked, tampered });
    setTicks(t => t + 1);

    const logMsg = `[TICK] Temp:${payload.temperature}°C  Bat:${payload.batteryLevel}%  Tamper:${tampered}  Spike:${spiked}`;
    addLog('send', logMsg);

    try {
      const getBaseUrl = () => {
        if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          return 'http://localhost:5000/api/v1';
        }
        return 'https://v1-organ-transport-system.onrender.com/api/v1';
      };

      const API = getBaseUrl();
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

  const timerRef = useRef(null);

  const start = useCallback(() => {
    if (running) return;
    addLog('info', `▶ Simulator started — Box:${cfg.boxId}  Mission:${cfg.missionId}  Interval:${cfg.interval}s`);
    setRunning(true);
    tick();
    timerRef.current = setInterval(tick, cfg.interval * 1000);
  }, [running, tick, cfg, addLog]);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    setRunning(false);
    addLog('info', '■ Simulator stopped.');
  }, [addLog]);

  const reset = useCallback(() => {
    stop();
    state.current = { temp: cfg.tempTarget, battery: 100, lat: cfg.startLat, lng: cfg.startLng, isManual: false, isTampered: false };
    setIsManualMode(false);
    setIsTamperedMode(false);
    setCurrentTemp(cfg.tempTarget);
    setCurrentBattery(100);
    setTelemetry(null);
    setTicks(0);
    setConnected(null);
    setLogs([]);
    addLog('info', '↺ Simulator reset.');
  }, [stop, cfg, addLog]);

  const overrideTemp = useCallback((val) => {
    state.current.temp = val;
    state.current.isManual = true;
    setIsManualMode(true);
    setCurrentTemp(val);
    addLog('info', `Manual override: Temp set to ${val}°C`);
    tick(); // Trigger instant ping & notification update!
  }, [addLog, tick]);

  const overrideBattery = useCallback((val) => {
    state.current.battery = val;
    state.current.isManual = true;
    setIsManualMode(true);
    setCurrentBattery(val);
    addLog('info', `Manual override: Battery set to ${val}%`);
    tick(); // Trigger instant ping & notification update!
  }, [addLog, tick]);

  const overrideTamper = useCallback((val) => {
    state.current.isTampered = val;
    state.current.isManual = true;
    setIsManualMode(true);
    setIsTamperedMode(val);
    addLog('info', `Manual override: Tamper set to ${val ? 'ON' : 'OFF'}`);
    tick(); // Trigger instant ping & notification update!
  }, [addLog, tick]);

  const releaseManual = useCallback(() => {
    state.current.isManual = false;
    setIsManualMode(false);
    setIsTamperedMode(false);
    state.current.isTampered = false;
    addLog('info', 'Manual override released.');
    tick();
  }, [addLog, tick]);

  const triggerMilestone = useCallback(async (milestone) => {
    addLog('info', `⚡ Triggering Milestone: ${milestone}`);
    try {
      const getBaseUrl = () => {
        if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          return 'http://localhost:5000/api/v1';
        }
        return 'https://v1-organ-transport-system.onrender.com/api/v1';
      };

      const API = getBaseUrl();
      let res = await fetch(`${API}/device/milestone`, {
        method: 'POST',
        headers: {
          'Content-Type':   'application/json',
          'x-device-id':    cfg.boxId,
          'x-device-secret':cfg.deviceSecret,
        },
        body: JSON.stringify({ milestone, missionId: cfg.missionId }),
      });

      if (!res.ok && res.status === 404) {
        // Fail-safe fallback to telemetry route with milestone metadata
        res = await fetch(`${API}/device/telemetry`, {
          method: 'POST',
          headers: {
            'Content-Type':   'application/json',
            'x-device-id':    cfg.boxId,
            'x-device-secret':cfg.deviceSecret,
          },
          body: JSON.stringify({
            missionId: cfg.missionId,
            temperature: currentTemp || 4.0,
            batteryLevel: currentBattery || 100,
            isTampered: isTamperedMode || false,
            milestone,
            geoLocation: { type: 'Point', coordinates: [cfg.startLng, cfg.startLat] }
          }),
        });
      }

      if (res.ok) {
        addLog('success', `✓ Blockchain Notarized Milestone: ${milestone}`);
      } else {
        addLog('warn', `✗ Milestone rejected [${res.status}]`);
      }
    } catch (err) {
      addLog('error', `✗ Milestone error — ${err.message}`);
    }
  }, [cfg, currentTemp, currentBattery, isTamperedMode, addLog]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <SimulatorContext.Provider value={{
      cfg, setCfg, running, telemetry, logs, ticks, connected, isManualMode, isTamperedMode, defaults,
      currentTemp, currentBattery,
      start, stop, reset, overrideTemp, overrideBattery, overrideTamper, releaseManual, triggerMilestone
    }}>
      {children}
    </SimulatorContext.Provider>
  );
};

export const useSimulatorContext = () => useContext(SimulatorContext);
