import crypto from 'crypto';
import TransportBox from '../../models/TransportBox.js';
import { TRANSPORT_ERRORS } from '../../constants/errorCodes.js';

/**
 * Hash a plain text device secret for storage.
 * In a real application, use bcrypt or argon2. For device secrets, sha256 is often sufficient if the secret is high entropy.
 */
export const hashDeviceSecret = (secret) => {
  return crypto.createHash('sha256').update(secret).digest('hex');
};

export const registerBox = async (boxData) => {
  // We expect deviceSecret in plain text here, which we will hash
  const { deviceSecret, ...rest } = boxData;
  const deviceSecretHash = hashDeviceSecret(deviceSecret);

  const box = new TransportBox({
    ...rest,
    deviceSecretHash,
  });

  await box.save();
  return box;
};

export const getBoxById = async (boxId) => {
  const box = await TransportBox.findOne({ boxId });
  if (!box) throw TRANSPORT_ERRORS.NOT_FOUND;
  return box;
};

export const listBoxes = async () => {
  return await TransportBox.find();
};

export const updateBoxStatus = async (boxId, status) => {
  const box = await TransportBox.findOne({ boxId });
  if (!box) throw TRANSPORT_ERRORS.NOT_FOUND;

  box.status = status;
  await box.save();
  return box;
};
