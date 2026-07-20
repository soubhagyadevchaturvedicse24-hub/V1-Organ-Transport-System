import TelemetryLog from '../../models/TelemetryLog.js';
import TransportBox from '../../models/TransportBox.js';
import { TRANSPORT_THRESHOLDS } from '../config/thresholds.js';
import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import logger from '../../logger/index.js';

export const logTelemetry = async (boxId, missionId, payload) => {
  // Validate basic payload
  if (payload.temperature === undefined || payload.batteryLevel === undefined) {
    throw new Error('Invalid telemetry payload');
  }

  const log = new TelemetryLog({
    boxId,
    missionId,
    telemetry: {
      temperature: payload.temperature,
      batteryLevel: payload.batteryLevel,
      geoLocation: payload.geoLocation,
      isTampered: payload.isTampered || false,
    },
  });

  await log.save();

  // Update Transport Box latest status
  await TransportBox.findByIdAndUpdate(boxId, {
    batteryHealth: payload.batteryLevel,
    lastHeartbeat: Date.now(),
    lastKnownLocation: payload.geoLocation,
  });

  eventBus.emit(TRANSPORT_EVENTS.TELEMETRY_RECEIVED, { boxId, missionId });

  // Evaluate thresholds and emit alerts if necessary
  evaluateAlerts(boxId, missionId, log.telemetry);

  return log;
};

export const evaluateAlerts = (boxId, missionId, telemetry) => {
  const alerts = [];

  if (telemetry.temperature > TRANSPORT_THRESHOLDS.MAX_TEMP) {
    alerts.push(`Temperature high: ${telemetry.temperature}°C`);
  }
  if (telemetry.temperature < TRANSPORT_THRESHOLDS.MIN_TEMP) {
    alerts.push(`Temperature low: ${telemetry.temperature}°C`);
  }
  if (telemetry.batteryLevel < TRANSPORT_THRESHOLDS.LOW_BATTERY) {
    alerts.push(`Battery low: ${telemetry.batteryLevel}%`);
  }
  if (TRANSPORT_THRESHOLDS.TAMPER_ENABLED && telemetry.isTampered) {
    alerts.push(`Box tamper detected!`);
  }

  if (alerts.length > 0) {
    eventBus.emit(TRANSPORT_EVENTS.TELEMETRY_ALERT, { boxId, missionId, alerts, telemetry });
    logger.warn(`TELEMETRY_ALERT [Box:${boxId}]: ${alerts.join(' | ')}`);
  }

  return alerts;
};
