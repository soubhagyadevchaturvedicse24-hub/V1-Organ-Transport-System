import { DONOR_ERRORS } from '../../constants/errorCodes.js';

/**
 * Domain rules regarding Donors.
 * Keeps business logic reusable and testable across modules.
 */

/**
 * Validates if an Organ can be created from a given Donor.
 * Only donors in AVAILABLE or COMPLETED states are legally/medically valid
 * for organ procurement based on the defined workflow.
 * 
 * @param {Object} donor - The donor document.
 * @returns {boolean}
 * @throws {Object} DONOR_ERRORS.INVALID_STATUS_FOR_ORGAN if invalid.
 */
export const canCreateOrganFromDonor = (donor) => {
  if (!donor) {
    return false;
  }
  
  const validStates = ['AVAILABLE', 'COMPLETED'];
  
  if (!validStates.includes(donor.status)) {
    throw {
      code: 'DONOR_004',
      message: `Cannot create organ from donor in status ${donor.status}. Must be AVAILABLE or COMPLETED.`,
      status: 409
    };
  }
  
  return true;
};
