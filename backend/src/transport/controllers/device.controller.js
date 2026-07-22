import * as telemetryService from '../services/telemetry.service.js';
import { DEVICE_ERRORS } from '../../constants/errorCodes.js';

import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';

export const postTelemetry = async (req, res, next) => {
  try {
    const { missionId, ...payload } = req.body;
    
    if (!missionId) {
      return next(DEVICE_ERRORS.INVALID_PAYLOAD);
    }

    const log = await telemetryService.logTelemetry(req.device.boxId, missionId, payload);
    res.status(201).json({ success: true, timestamp: log.timestamp });
  } catch (error) {
    next(error);
  }
};

export const triggerMilestone = async (req, res, next) => {
  try {
    const { milestone, missionId = 'TRN-2026-001' } = req.body;
    const map = {
      'TRANSPORT_CREATED': TRANSPORT_EVENTS.TRANSPORT_CREATED,
      'TRANSPORT_DISPATCHED': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
      'TRANSPORT_ARRIVED': TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
      'TRANSPORT_COMPLETED': TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
    };

    const eventName = map[milestone];
    if (!eventName) {
      return res.status(400).json({ success: false, message: `Unknown milestone: ${milestone}` });
    }

    eventBus.emit(eventName, {
      missionId,
      boxId: req.device?.boxId || 'BOX-2026-FABRIC-ALPHA',
      timestamp: new Date().toISOString(),
      triggeredBy: 'IoT Simulator',
      milestone,
    });

    res.status(200).json({ success: true, milestone, eventName });
  } catch (error) {
    next(error);
  }
};
