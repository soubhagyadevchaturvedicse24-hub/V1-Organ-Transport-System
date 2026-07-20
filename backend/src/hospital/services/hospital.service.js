import Hospital from '../../models/Hospital.js';
import { hospitalMachine } from '../../workflow/transitions/hospital.transitions.js';
import { HOSPITAL_ERRORS } from '../../constants/errorCodes.js';
import { generateHospitalCode } from '../utils/hospitalCode.js';
import logger from '../../logger/index.js';


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
    throw HOSPITAL_ERRORS.NOT_FOUND;
  }

  return hospital;
};

export const updateHospital = async (id, data) => {
  const hospital = await Hospital.findById(id);
  if (!hospital) {
    throw HOSPITAL_ERRORS.NOT_FOUND;
  }
  if (hospital.status !== 'DRAFT') {
    throw HOSPITAL_ERRORS.IMMUTABLE_STATUS;
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
    throw HOSPITAL_ERRORS.NOT_FOUND;
  }

  // Will throw WORKFLOW_002 if the transition is invalid
  const newStatus = hospitalMachine.transition(hospital.status, action);

  hospital.status = newStatus;

  // Apply action-specific fields
  if (action === 'reject') {
    if (!extra.rejectionReason) {
      throw HOSPITAL_ERRORS.REJECTION_REASON_REQUIRED;
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
