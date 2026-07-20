import Donor from '../../models/Donor.js';
import Hospital from '../../models/Hospital.js';
import { donorMachine } from '../../workflow/transitions/donor.transitions.js';
import { DONOR_ERRORS, HOSPITAL_ERRORS } from '../../constants/errorCodes.js';
import { generateDonorCode } from '../utils/donorCode.js';
import logger from '../../logger/index.js';

export const createDonor = async (data, userId) => {
  const hospital = await Hospital.findById(data.hospitalId);
  if (!hospital) {
    throw HOSPITAL_ERRORS.NOT_FOUND;
  }

  const donorId = await generateDonorCode(hospital.address.city);

  const donor = await Donor.create({
    ...data,
    donorId,
    createdBy: userId,
    status: 'DRAFT',
  });

  logger.info(`DONOR_CREATED: ${donorId} by User[${userId}]`);
  return donor;
};

export const listDonors = async ({ status, hospitalId, bloodGroup, page, limit }) => {
  const filter = {};
  if (status) filter.status = status;
  if (hospitalId) filter.hospitalId = hospitalId;
  if (bloodGroup) filter.bloodGroup = bloodGroup;
  
  const skip = (page - 1) * limit;

  const [donors, total] = await Promise.all([
    Donor.find(filter)
      .skip(skip)
      .limit(limit)
      .populate('hospitalId', 'name hospitalCode')
      .populate('createdBy', 'displayName role')
      .sort({ createdAt: -1 }),
    Donor.countDocuments(filter),
  ]);

  return {
    donors,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const getDonor = async (id) => {
  const donor = await Donor.findById(id)
    .populate('hospitalId', 'name hospitalCode')
    .populate('createdBy', 'displayName role')
    .populate('medicalEligibility.assessedBy', 'displayName role');

  if (!donor) {
    throw DONOR_ERRORS.NOT_FOUND;
  }

  return donor;
};

export const updateDonor = async (id, data) => {
  const donor = await Donor.findById(id);
  if (!donor) {
    throw DONOR_ERRORS.NOT_FOUND;
  }
  if (donor.status !== 'DRAFT') {
    throw DONOR_ERRORS.IMMUTABLE_STATUS;
  }

  // Prevent modifying critical workflow sub-objects through plain update
  delete data.status;
  delete data.medicalEligibility;
  delete data.consent;

  Object.assign(donor, data);
  await donor.save();

  logger.info(`DONOR_UPDATED: ${donor.donorId}`);
  return donor;
};

/**
 * Generic workflow action handler for Donor.
 */
const applyTransition = async (id, action, actorId, extra = {}) => {
  const donor = await Donor.findById(id);
  if (!donor) {
    throw DONOR_ERRORS.NOT_FOUND;
  }

  const newStatus = donorMachine.transition(donor.status, action);
  donor.status = newStatus;

  // Action-specific state updates
  if (action === 'reject') {
    if (!extra.rejectionReason) {
      throw DONOR_ERRORS.REJECTION_REASON_REQUIRED;
    }
    donor.rejectionReason = extra.rejectionReason;
    if (donor.status === 'PENDING_MEDICAL_REVIEW') {
      donor.medicalEligibility.status = 'INELIGIBLE';
    } else {
      donor.consent.status = 'REJECTED';
    }
  }

  if (action === 'medicalReview') {
    donor.medicalEligibility.status = 'ELIGIBLE';
    donor.medicalEligibility.assessedBy = actorId;
    donor.medicalEligibility.assessedAt = new Date();
  }

  if (action === 'verifyConsent') {
    donor.consent.status = 'VERIFIED';
    donor.consent.verifiedAt = new Date();
  }

  await donor.save();

  // Audit Events Mapping
  const actionToEvent = {
    submit: 'DONOR_SUBMITTED',
    medicalReview: 'DONOR_MEDICAL_APPROVED',
    verifyConsent: 'DONOR_CONSENT_VERIFIED',
    activate: 'DONOR_ACTIVATED',
    reject: 'DONOR_REJECTED',
    complete: 'DONOR_COMPLETED',
    archive: 'DONOR_ARCHIVED',
    withdraw: 'DONOR_WITHDRAWN',
  };
  
  const eventName = actionToEvent[action] || `DONOR_${action.toUpperCase()}`;
  logger.info(`${eventName}: ${donor.donorId} | Actor[${actorId}]`);

  return donor;
};

export const submitDonor = (id, actorId) => applyTransition(id, 'submit', actorId);
export const medicalReviewDonor = (id, actorId) => applyTransition(id, 'medicalReview', actorId);
export const verifyConsentDonor = (id, actorId) => applyTransition(id, 'verifyConsent', actorId);
export const activateDonor = (id, actorId) => applyTransition(id, 'activate', actorId);
export const completeDonor = (id, actorId) => applyTransition(id, 'complete', actorId);
export const archiveDonor = (id, actorId) => applyTransition(id, 'archive', actorId);
export const withdrawDonor = (id, actorId) => applyTransition(id, 'withdraw', actorId);
export const rejectDonor = (id, actorId, rejectionReason) =>
  applyTransition(id, 'reject', actorId, { rejectionReason });
