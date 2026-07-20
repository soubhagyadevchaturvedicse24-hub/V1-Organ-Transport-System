import Hospital from '../../models/Hospital.js';
import { hospitalMachine } from '../../workflow/transitions/hospital.transitions.js';
import logger from '../../logger/index.js';

/**
 * Auto-generate a hospitalCode.
 * Format: HOS-<CITY_PREFIX>-<5-digit-sequence>
 * e.g. HOS-DEL-00001
 */
const generateHospitalCode = async (city) => {
  const prefix = city.slice(0, 3).toUpperCase();
  const count = await Hospital.countDocuments();
  const seq = String(count + 1).padStart(5, '0');
  return `HOS-${prefix}-${seq}`;
};

export const createHospital = async (data, userId) => {
  const hospitalCode = await generateHospitalCode(data.address.city);

  const hospital = await Hospital.create({
    ...data,
    hospitalCode,
    createdBy: userId,
    status: 'DRAFT',
  });

  logger.info(`HOSPITAL_CREATED: ${hospitalCode} by User[${userId}]`);
  return hospital;
};

export const listHospitals = async ({ status, page, limit }) => {
  const filter = status ? { status } : {};
  const skip = (page - 1) * limit;

  const [hospitals, total] = await Promise.all([
    Hospital.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'displayName email role')
      .sort({ createdAt: -1 }),
    Hospital.countDocuments(filter),
  ]);

  return {
    hospitals,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const getHospital = async (id) => {
  const hospital = await Hospital.findById(id)
    .populate('createdBy', 'displayName email role')
    .populate('approvedBy', 'displayName email role');

  if (!hospital) {
    throw { code: 'HOSPITAL_001', message: 'Hospital not found', status: 404 };
  }

  return hospital;
};

export const updateHospital = async (id, data) => {
  const hospital = await Hospital.findById(id);
  if (!hospital) {
    throw { code: 'HOSPITAL_001', message: 'Hospital not found', status: 404 };
  }
  if (hospital.status !== 'DRAFT') {
    throw {
      code: 'HOSPITAL_002',
      message: 'Hospital can only be updated while in DRAFT status',
      status: 409,
    };
  }

  Object.assign(hospital, data);
  await hospital.save();

  logger.info(`HOSPITAL_UPDATED: ${hospital.hospitalCode}`);
  return hospital;
};

/**
 * Generic workflow action handler.
 * Uses the state machine to validate and apply any transition.
 * No transition logic in controllers — it all flows through here.
 */
const applyTransition = async (id, action, actorId, extra = {}) => {
  const hospital = await Hospital.findById(id);
  if (!hospital) {
    throw { code: 'HOSPITAL_001', message: 'Hospital not found', status: 404 };
  }

  // Will throw WORKFLOW_002 if the transition is invalid
  const newStatus = hospitalMachine.transition(hospital.status, action);

  hospital.status = newStatus;

  // Apply action-specific fields
  if (action === 'reject') {
    if (!extra.rejectionReason) {
      throw { code: 'HOSPITAL_003', message: 'Rejection reason is required', status: 400 };
    }
    hospital.rejectionReason = extra.rejectionReason;
  }

  if (action === 'approve' || action === 'activate') {
    hospital.approvedBy = actorId;
    hospital.approvedAt = new Date();
  }

  await hospital.save();

  const eventName = `HOSPITAL_${action.toUpperCase()}D`;
  logger.info(`${eventName}: ${hospital.hospitalCode} | Actor[${actorId}]`);

  return hospital;
};

export const submitHospital = (id, actorId) => applyTransition(id, 'submit', actorId);
export const reviewHospital = (id, actorId) => applyTransition(id, 'review', actorId);
export const approveHospital = (id, actorId) => applyTransition(id, 'approve', actorId);
export const rejectHospital = (id, actorId, rejectionReason) =>
  applyTransition(id, 'reject', actorId, { rejectionReason });
export const activateHospital = (id, actorId) => applyTransition(id, 'activate', actorId);
export const suspendHospital = (id, actorId) => applyTransition(id, 'suspend', actorId);
export const reactivateHospital = (id, actorId) => applyTransition(id, 'reactivate', actorId);
export const deactivateHospital = (id, actorId) => applyTransition(id, 'deactivate', actorId);
