import crypto from 'crypto';
import TransportBox from '../../models/TransportBox.js';
import TransportMission from '../../models/TransportMission.js';
import TelemetryLog from '../../models/TelemetryLog.js';
import { logTelemetry } from '../services/telemetry.service.js';
import logger from '../../logger/index.js';

export const registerDeviceKey = async (req, res, next) => {
  try {
    const { deviceId, publicKey } = req.body;
    if (!deviceId || !publicKey) {
      return res.status(400).json({ success: false, message: 'deviceId and publicKey are required' });
    }

    const box = await TransportBox.findOne({ $or: [{ boxId: deviceId }, { deviceId }] });
    if (!box) {
      logger.warn(`KEY_REG_FAILED: Device not found for ID ${deviceId}`);
      return res.status(404).json({ success: false, message: 'Device not found' });
    }

    box.devicePublicKey = publicKey;
    await box.save();

    logger.info(`KEY_REG_SUCCESS: Registered public key for Box ${box.boxId}`);
    res.status(200).json({ success: true, message: 'Device public key registered successfully' });
  } catch (error) {
    next(error);
  }
};

export const postIngressTelemetry = async (req, res, next) => {
  try {
    const boxIdHeader = req.headers['x-device-id'];
    const signatureHex = req.headers['x-device-signature'];

    if (!boxIdHeader || !signatureHex) {
      return res.status(401).json({ success: false, message: 'Authentication headers missing' });
    }

    const box = await TransportBox.findOne({ $or: [{ boxId: boxIdHeader }, { deviceId: boxIdHeader }] });
    if (!box) {
      return res.status(401).json({ success: false, message: 'Device not authorized' });
    }

    // Verify ECDSA Signature if public key is registered
    if (box.devicePublicKey) {
      const payloadString = JSON.stringify(req.body);
      const payloadHash = crypto.createHash('sha256').update(payloadString).digest();
      try {
        const verified = crypto.verify(
          'SHA-256',
          payloadHash,
          box.devicePublicKey,
          Buffer.from(signatureHex, 'hex')
        );

        if (!verified) {
          logger.warn(`SIGNATURE_VERIFICATION_FAILED: Box ${box.boxId}`);
          return res.status(401).json({ success: false, message: 'Invalid device signature' });
        }
      } catch (err) {
        logger.error(`SIGNATURE_VERIFICATION_ERROR: Box ${box.boxId} | ${err.message}`);
        return res.status(401).json({ success: false, message: 'Signature verification error' });
      }
    } else {
      logger.warn(`SIGNATURE_VERIFICATION_BYPASS: Box ${box.boxId} has no registered public key`);
    }

    // Map spec payload to our internal service representation
    const { deviceId, telemetry, gps } = req.body;
    
    // Find active mission for the box
    const activeMission = await TransportMission.findOne({
      boxId: box._id,
      status: { $in: ['DISPATCHED', 'IN_TRANSIT'] }
    });

    const missionId = activeMission ? activeMission._id.toString() : 'DEMO_MISSION';

    const servicePayload = {
      temperature: telemetry.temperature,
      batteryLevel: telemetry.batteryLevel !== undefined ? telemetry.batteryLevel : 95.0, // Default for spec payload which doesn't specify battery
      isTampered: telemetry.reed_latch === 0,
      geoLocation: {
        type: 'Point',
        coordinates: [gps.longitude, gps.longitude ? gps.latitude : null].filter(c => c !== null)
      }
    };

    const log = await logTelemetry(box._id, missionId, servicePayload);
    res.status(201).json({ success: true, timestamp: log.timestamp });
  } catch (error) {
    next(error);
  }
};
