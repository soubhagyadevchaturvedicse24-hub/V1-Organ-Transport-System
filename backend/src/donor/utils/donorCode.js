import Donor from '../../models/Donor.js';

/**
 * Generate a unique, human-readable donor code.
 *
 * Format: DON-<CITY_PREFIX>-<6-digit-sequence>
 * Example: DON-RAI-000001
 *
 * @param {string} city - The city name from the donor's hospital.
 * @returns {Promise<string>}
 */
export const generateDonorCode = async (city) => {
  const prefix = city.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const count = await Donor.countDocuments();
  const seq = String(count + 1).padStart(6, '0');
  return `DON-${prefix}-${seq}`;
};
