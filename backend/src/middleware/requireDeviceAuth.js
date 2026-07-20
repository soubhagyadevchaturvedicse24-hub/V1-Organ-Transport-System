import TransportBox from '../models/TransportBox.js';
import { hashDeviceSecret } from '../transport/services/box.service.js';
import { DEVICE_ERRORS } from '../constants/errorCodes.js';

export const requireDeviceAuth = async (req, res, next) => {
  try {
    const boxId = req.headers['x-device-id'];
    const deviceSecret = req.headers['x-device-secret'];

    if (!boxId || !deviceSecret) {
      return next(DEVICE_ERRORS.UNAUTHORIZED);
    }

    const box = await TransportBox.findOne({ boxId });
    if (!box) {
      return next(DEVICE_ERRORS.UNAUTHORIZED);
    }

    const hashedSecret = hashDeviceSecret(deviceSecret);
    
    if (box.deviceSecretHash !== hashedSecret) {
      return next(DEVICE_ERRORS.UNAUTHORIZED);
    }

    // Attach box to request for downstream handlers
    req.device = { boxId: box._id, code: box.boxId };
    next();
  } catch (error) {
    next(error);
  }
};
