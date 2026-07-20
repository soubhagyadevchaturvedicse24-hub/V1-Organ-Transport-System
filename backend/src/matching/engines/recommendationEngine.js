/**
 * Recommendation Engine
 * Sorts scored candidates and applies limits.
 * 
 * @param {Array} scoredRecipients Array of {recipient, score, breakdown}
 * @param {Number} limit Number of top matches to return
 * @returns {Array} Sorted and truncated array
 */
export const recommendMatches = (scoredRecipients, limit = 5) => {
  // Sort descending by score
  const sorted = [...scoredRecipients].sort((a, b) => b.score - a.score);
  
  // Return top N
  return sorted.slice(0, limit);
};
