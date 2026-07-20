/**
 * Medical Compatibility Rules
 * ABO Compatibility Matrix:
 * O can give to O, A, B, AB (O- is universal donor)
 * A can give to A, AB
 * B can give to B, AB
 * AB can give to AB (AB+ is universal recipient)
 * Note: Simplified rules for exact match or generic compatible paths
 */
const isBloodGroupCompatible = (donorBg, recipientBg) => {
  if (donorBg === recipientBg) return true;
  
  // O- can give to anyone
  if (donorBg === 'O-') return true;

  // AB+ can receive from anyone
  if (recipientBg === 'AB+') return true;

  // Simplified generic compatibilities (assuming Rh+ can't give to Rh- generally)
  const compatibilities = {
    'O+': ['O+', 'A+', 'B+', 'AB+'],
    'A-': ['A-', 'A+', 'AB-', 'AB+'],
    'A+': ['A+', 'AB+'],
    'B-': ['B-', 'B+', 'AB-', 'AB+'],
    'B+': ['B+', 'AB+'],
    'AB-': ['AB-', 'AB+'],
  };

  return compatibilities[donorBg]?.includes(recipientBg) || false;
};

/**
 * Compatibility Engine
 * Pure medical compatibility check.
 * 
 * @param {Object} organ 
 * @param {Array} recipients 
 * @returns {Array} List of medically compatible recipients
 */
export const checkCompatibility = (organ, recipients) => {
  return recipients.filter(recipient => {
    // 1. Organ Type Match
    if (recipient.requiredOrganType !== organ.organType) {
      return false;
    }

    // 2. Blood Group Match
    if (!isBloodGroupCompatible(organ.bloodGroup, recipient.bloodGroup)) {
      return false;
    }

    return true;
  });
};
