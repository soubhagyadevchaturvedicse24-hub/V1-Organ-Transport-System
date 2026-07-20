import Hospital from '../../models/Hospital.js';

/**
 * Generate a unique, human-readable hospital code.
 *
 * Format: HOS-<CITY_PREFIX>-<5-digit-sequence>
 * Examples:
 *   HOS-DEL-00001   (first hospital in Delhi)
 *   HOS-MUM-00012   (twelfth hospital in Mumbai)
 *
 * @param {string} city - The city name from the hospital's address.
 * @returns {Promise<string>}
 */
export const generateHospitalCode = async (city) => {
  const prefix = city.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const count = await Hospital.countDocuments();
  const seq = String(count + 1).padStart(5, '0');
  return `HOS-${prefix}-${seq}`;
};
