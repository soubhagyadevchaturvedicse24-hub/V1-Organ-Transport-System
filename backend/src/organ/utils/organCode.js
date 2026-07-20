import Organ from '../../models/Organ.js';
import { ORGAN_DEFAULTS } from './organDefaults.js';

/**
 * Generate a unique, human-readable organ code.
 *
 * Format: ORG-<ORGAN_CODE>-<6-digit-sequence>
 * Example: ORG-KID-000001
 *
 * @param {string} organType - The enum value for the organ (e.g. 'KIDNEY')
 * @returns {Promise<string>}
 */
export const generateOrganCode = async (organType) => {
  const code = ORGAN_DEFAULTS[organType]?.code || 'UNK';
  const count = await Organ.countDocuments({ organType });
  const seq = String(count + 1).padStart(6, '0');
  return `ORG-${code}-${seq}`;
};
