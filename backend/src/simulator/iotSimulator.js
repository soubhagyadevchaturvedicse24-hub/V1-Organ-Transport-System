import dotenv from 'dotenv';
import { SIMULATOR_CONFIG } from './config/simulator.config.js';

dotenv.config();

/**
 * A basic simulation script for the Transport Box IoT device.
 * In a real scenario, this would use a robust HTTP client (like axios) and connect to the database 
 * or API to pick up active missions.
 * 
 * Usage:
 * node src/simulator/iotSimulator.js [boxId] [deviceSecret] [missionId]
 */

const boxId = process.argv[2] || 'BOX-001';
const deviceSecret = process.argv[3] || 'secret123';
const missionId = process.argv[4] || 'TRN-001';

console.log(`Starting IoT Simulator for Box: ${boxId}, Mission: ${missionId}`);

let currentBattery = 100.0;
let currentTemp = SIMULATOR_CONFIG.TARGET_TEMPERATURE;
let inAlertMode = false;

// Simple interpolation state
let currentLat = 28.6139; // Default starting loc (e.g. Delhi)
let currentLon = 77.2090;

const sendTelemetry = async () => {
  // Random anomalies
  const isTampered = Math.random() < SIMULATOR_CONFIG.TAMPER_ALERT_CHANCE;
  const tempSpike = Math.random() < SIMULATOR_CONFIG.TEMPERATURE_SPIKE_CHANCE;
  
  if (tempSpike) {
    currentTemp = 9.0; // Above MAX_TEMP (8.0)
  } else if (!tempSpike && currentTemp > SIMULATOR_CONFIG.TARGET_TEMPERATURE) {
    currentTemp -= 1.0; // Cool down back to target
  }

  currentBattery = Math.max(0, currentBattery - SIMULATOR_CONFIG.BATTERY_DRAIN_RATE);
  currentLat += 0.001;
  currentLon += 0.001;

  inAlertMode = isTampered || currentTemp > 8.0 || currentBattery < 20.0;

  const payload = {
    missionId,
    temperature: currentTemp,
    batteryLevel: currentBattery,
    isTampered,
    geoLocation: {
      type: 'Point',
      coordinates: [currentLon, currentLat],
    },
  };

  try {
    const res = await fetch(`${SIMULATOR_CONFIG.API_BASE_URL}/device/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': boxId,
        'x-device-secret': deviceSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Telemetry rejected: ${res.status} ${res.statusText}`);
    } else {
      console.log(`Telemetry accepted. AlertMode: ${inAlertMode} | Temp: ${currentTemp}°C | Bat: ${currentBattery.toFixed(1)}% | Tamper: ${isTampered}`);
    }
  } catch (error) {
    console.error(`Failed to send telemetry: ${error.message}`);
  }

  const nextInterval = inAlertMode 
    ? SIMULATOR_CONFIG.POLLING_INTERVAL_ALERT_MS 
    : SIMULATOR_CONFIG.POLLING_INTERVAL_NORMAL_MS;
  
  setTimeout(sendTelemetry, nextInterval);
};

// Start the loop
setTimeout(sendTelemetry, 1000);
