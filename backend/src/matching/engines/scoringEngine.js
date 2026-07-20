import { SCORING_WEIGHTS, URGENCY_MULTIPLIERS } from '../config/weights.js';
import { calculateHaversineDistance } from '../utils/distance.js';

/**
 * Scoring Engine
 * Assigns numeric score to eligible recipients.
 * 
 * @param {Object} organ 
 * @param {Array} recipients 
 * @returns {Array} List of scored recipient objects
 */
export const scoreRecipients = (organ, recipients) => {
  // Extract donor hospital coordinates if populated
  let donorLon = null, donorLat = null;
  if (organ.donorId?.hospitalId?.geoLocation?.coordinates) {
    [donorLon, donorLat] = organ.donorId.hospitalId.geoLocation.coordinates;
  } else if (organ.location?.coordinates) { // Fallback if organ tracks location directly
    [donorLon, donorLat] = organ.location.coordinates;
  }

  return recipients.map(recipient => {
    let score = 0;
    const breakdown = {
      urgency: 0,
      waitingTime: 0,
      distance: 0,
      pediatric: 0,
    };

    // 1. Urgency
    const urgencyMult = URGENCY_MULTIPLIERS[recipient.urgencyLevel] || 0;
    breakdown.urgency = urgencyMult * SCORING_WEIGHTS.URGENCY;
    score += breakdown.urgency;

    // 2. Waiting Time (e.g., 1 point per month on waitlist up to max)
    const monthsWaiting = (Date.now() - new Date(recipient.waitlistDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
    // Cap waiting time points at the max weight
    breakdown.waitingTime = Math.min(monthsWaiting, SCORING_WEIGHTS.WAITING_TIME);
    score += breakdown.waitingTime;

    // 3. Pediatric Priority
    if (recipient.age < 18) {
      breakdown.pediatric = SCORING_WEIGHTS.PEDIATRIC;
      score += breakdown.pediatric;
    }

    // 4. Distance Calculation
    if (donorLon !== null && donorLat !== null && recipient.geoLocation?.coordinates) {
      const [recLon, recLat] = recipient.geoLocation.coordinates;
      const distanceKm = calculateHaversineDistance(donorLon, donorLat, recLon, recLat);
      
      // Inverse distance scoring: Closer = higher points.
      // E.g., if distance is 0, full points. If distance > 1000km, 0 points.
      const MAX_DISTANCE_FOR_POINTS = 1000;
      if (distanceKm < MAX_DISTANCE_FOR_POINTS) {
        breakdown.distance = ((MAX_DISTANCE_FOR_POINTS - distanceKm) / MAX_DISTANCE_FOR_POINTS) * SCORING_WEIGHTS.DISTANCE;
        score += breakdown.distance;
      }
    }
    
    const explanation = `Compatibility:
✔ Blood Group
✔ Organ Type

Eligibility:
✔ Active Recipient
${recipient.hospitalId ? '✔ Active Hospital' : ''}

Scoring:
Urgency ............ +${breakdown.urgency.toFixed(2)}
Waiting Time ....... +${breakdown.waitingTime.toFixed(2)}
Distance ........... +${breakdown.distance.toFixed(2)}
Pediatric .......... +${breakdown.pediatric.toFixed(2)}

Final Score ........ ${score.toFixed(2)}`;

    return {
      recipient,
      score: Number(score.toFixed(2)),
      breakdown: {
        urgency: Number(breakdown.urgency.toFixed(2)),
        waitingTime: Number(breakdown.waitingTime.toFixed(2)),
        distance: Number(breakdown.distance.toFixed(2)),
        pediatric: Number(breakdown.pediatric.toFixed(2)),
      },
      explanation
    };
  });
};
