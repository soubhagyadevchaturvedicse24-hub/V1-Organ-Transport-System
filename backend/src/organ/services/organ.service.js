import Organ from '../../models/Organ.js';
import Donor from '../../models/Donor.js';
import Hospital from '../../models/Hospital.js';
import { organMachine } from '../../workflow/transitions/organ.transitions.js';
import { ORGAN_ERRORS, DONOR_ERRORS, HOSPITAL_ERRORS } from '../../constants/errorCodes.js';
import { canCreateOrganFromDonor } from '../../domain/validators/donorRules.js';
import { generateOrganCode } from '../utils/organCode.js';
import { ORGAN_DEFAULTS } from '../utils/organDefaults.js';
import { eventBus } from '../../domain/events/index.js';
import { ORGAN_EVENTS } from '../../domain/events/organ.events.js';
import logger from '../../logger/index.js';

export const registerOrgan = async (data, userId) => {
  const donor = await Donor.findById(data.donorId);
  if (!donor) {
    throw DONOR_ERRORS.NOT_FOUND;
  }

  // Cross-domain rule validation
  canCreateOrganFromDonor(donor);

  const organId = await generateOrganCode(data.organType);
  const coldIschemiaLimit = ORGAN_DEFAULTS[data.organType].defaultColdIschemiaTimeLimitHours;

  const organ = await Organ.create({
    organId,
    donorId: donor._id,
    organType: data.organType,
    bloodGroup: donor.bloodGroup,
    medicalAssessment: {
      coldIschemiaTimeLimit: coldIschemiaLimit,
    },
    createdBy: userId,
    status: 'RECOVERED',
  });

  logger.info(`ORGAN_REGISTERED: ${organId} by User[${userId}]`);
  return organ;
};

export const listOrgans = async ({ status, organType, allocationStatus, page, limit }) => {
  const filter = {};
  if (status) filter.status = status;
  if (organType) filter.organType = organType;
  if (allocationStatus) filter['allocation.allocationStatus'] = allocationStatus;

  const skip = (page - 1) * limit;

  const [organs, total] = await Promise.all([
    Organ.find(filter)
      .skip(skip)
      .limit(limit)
      .populate({ path: 'donorId', select: 'donorId bloodGroup' })
      .populate('allocation.allocatedToHospital', 'name hospitalCode')
      .sort({ createdAt: -1 }),
    Organ.countDocuments(filter),
  ]);

  return {
    organs,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
};

export const getOrgan = async (id) => {
  const organ = await Organ.findById(id)
    .populate('donorId', 'donorId bloodGroup status')
    .populate('medicalAssessment.assessedBy', 'displayName role')
    .populate('allocation.allocatedToHospital', 'name hospitalCode')
    .populate('createdBy', 'displayName role');

  if (!organ) {
    throw ORGAN_ERRORS.NOT_FOUND;
  }

  return organ;
};

export const updateAssessment = async (id, data, actorId) => {
  const organ = await Organ.findById(id);
  if (!organ) {
    throw ORGAN_ERRORS.NOT_FOUND;
  }

  // Can only update assessment while in IN_ASSESSMENT
  if (organ.status !== 'IN_ASSESSMENT') {
    throw ORGAN_ERRORS.IMMUTABLE_STATUS;
  }

  if (data.viabilityStatus) organ.medicalAssessment.viabilityStatus = data.viabilityStatus;
  if (data.preservationMethod) organ.medicalAssessment.preservationMethod = data.preservationMethod;
  if (data.qualityAssessment) organ.medicalAssessment.qualityAssessment = data.qualityAssessment;

  organ.medicalAssessment.assessedBy = actorId;

  await organ.save();
  logger.info(`ORGAN_UPDATED: ${organ.organId} by Actor[${actorId}]`);

  return organ;
};

/**
 * Generic workflow action handler for Organ.
 */
const applyTransition = async (id, action, actorId, extra = {}) => {
  const organ = await Organ.findById(id);
  if (!organ) {
    throw ORGAN_ERRORS.NOT_FOUND;
  }

  const newStatus = organMachine.transition(organ.status, action);
  organ.status = newStatus;

  // Action-specific state updates
  if (action === 'beginAssessment') {
    organ.medicalAssessment.assessedBy = actorId;
  }

  if (action === 'approveViability') {
    if (organ.medicalAssessment.viabilityStatus === 'PENDING_ASSESSMENT') {
      organ.medicalAssessment.viabilityStatus = 'VIABLE';
    }
  }

  if (action === 'allocate') {
    if (!extra.allocatedToHospital) {
      throw ORGAN_ERRORS.ALLOCATION_REQUIRED;
    }
    const hospital = await Hospital.findById(extra.allocatedToHospital);
    if (!hospital) {
      throw HOSPITAL_ERRORS.NOT_FOUND;
    }
    organ.allocation.allocationStatus = 'ALLOCATED';
    organ.allocation.allocatedToHospital = extra.allocatedToHospital;
  }

  if (action === 'dispatch') {
    if (!extra.transportBoxId) {
      throw ORGAN_ERRORS.TRANSPORT_BOX_REQUIRED;
    }
    organ.logistics.transportBoxId = extra.transportBoxId;
    organ.logistics.transportStatus = 'IN_TRANSIT';
  }

  if (action === 'receive') {
    organ.logistics.transportStatus = 'DELIVERED';
  }

  if (action === 'discard') {
    if (!extra.discardReason) {
      throw ORGAN_ERRORS.DISCARD_REASON_REQUIRED;
    }
    organ.discardReason = extra.discardReason;
    
    // Cleanup other statuses based on current state
    if (['AWAITING_ALLOCATION', 'ALLOCATED'].includes(organ.status)) {
      organ.allocation.allocationStatus = 'UNALLOCATED';
      organ.allocation.allocatedToHospital = null;
    }
    if (organ.status === 'IN_TRANSIT') {
       // Typically you'd halt transit, for now just note it in discard
    }
  }

  await organ.save();

  // Audit Events Mapping
  const actionToEvent = {
    beginAssessment: 'ORGAN_ASSESSMENT_STARTED',
    approveViability: 'ORGAN_VIABILITY_APPROVED',
    allocate: 'ORGAN_ALLOCATED',
    dispatch: 'ORGAN_DISPATCHED',
    receive: 'ORGAN_RECEIVED',
    discard: 'ORGAN_DISCARDED',
  };

  const eventName = actionToEvent[action];
  logger.info(`${eventName}: ${organ.organId} | Actor[${actorId}]`);

  // Emit Domain Event if it reaches AWAITING_ALLOCATION
  if (action === 'approveViability' && newStatus === 'AWAITING_ALLOCATION') {
    eventBus.emit(ORGAN_EVENTS.ORGAN_AVAILABLE, { organId: organ._id });
  }

  return organ;
};

export const beginAssessment = (id, actorId) => applyTransition(id, 'beginAssessment', actorId);
export const approveViability = (id, actorId) => applyTransition(id, 'approveViability', actorId);
export const allocateOrgan = (id, actorId, allocatedToHospital) => applyTransition(id, 'allocate', actorId, { allocatedToHospital });
export const dispatchOrgan = (id, actorId, transportBoxId) => applyTransition(id, 'dispatch', actorId, { transportBoxId });
export const receiveOrgan = (id, actorId) => applyTransition(id, 'receive', actorId);
export const discardOrgan = (id, actorId, discardReason) => applyTransition(id, 'discard', actorId, { discardReason });
