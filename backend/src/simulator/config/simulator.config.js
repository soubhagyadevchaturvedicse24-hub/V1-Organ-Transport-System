export const SIMULATOR_CONFIG = Object.freeze({
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api/v1',
  POLLING_INTERVAL_NORMAL_MS: 30000, // 30 seconds
  POLLING_INTERVAL_ALERT_MS: 5000,   // 5 seconds
  TEMPERATURE_SPIKE_CHANCE: 0.05,    // 5% chance per tick
  TAMPER_ALERT_CHANCE: 0.01,         // 1% chance per tick
  BATTERY_DRAIN_RATE: 0.2,           // % drop per tick
  GPS_SPEED_KM_PER_TICK: 0.5,        // Speed of movement
  TARGET_TEMPERATURE: 4.0,           // Normal box temp (Celsius)
});
