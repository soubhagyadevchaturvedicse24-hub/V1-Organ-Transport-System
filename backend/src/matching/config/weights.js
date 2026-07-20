export const SCORING_WEIGHTS = Object.freeze({
  URGENCY: 50,       // Highest priority: Medical emergency
  WAITING_TIME: 30,  // Second priority: Time on waitlist
  DISTANCE: 10,      // Third priority: Proximity (lower distance = higher score)
  PEDIATRIC: 10,     // Bonus for pediatric recipients
});

export const URGENCY_MULTIPLIERS = Object.freeze({
  EMERGENCY: 1.0,
  URGENT: 0.6,
  ROUTINE: 0.2,
});
