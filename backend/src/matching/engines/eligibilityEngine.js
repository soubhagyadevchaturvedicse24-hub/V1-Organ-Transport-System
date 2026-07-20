/**
 * Eligibility Engine
 * Checks administrative and operational viability.
 * 
 * @param {Array} recipients 
 * @returns {Array} List of eligible recipients
 */
export const checkEligibility = (recipients) => {
  return recipients.filter(recipient => {
    // 1. Recipient must be active on the waitlist
    if (recipient.status !== 'ACTIVE') {
      return false;
    }

    // 2. Hospital checks (if populated)
    if (recipient.hospitalId && recipient.hospitalId.status) {
      // If hospital is populated, verify it's active
      if (recipient.hospitalId.status !== 'ACTIVE') {
        return false;
      }
    }

    // Additional rules (Consent, required documents, etc.) would go here.
    return true;
  });
};
