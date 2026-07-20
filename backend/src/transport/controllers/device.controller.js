import * as telemetryService from '../services/telemetry.service.js';
import { DEVICE_ERRORS } from '../../constants/errorCodes.js';

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
