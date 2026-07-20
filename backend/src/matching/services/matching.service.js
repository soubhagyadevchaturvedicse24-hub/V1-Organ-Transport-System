import Match from '../../models/Match.js';
import Organ from '../../models/Organ.js';
import Recipient from '../../models/Recipient.js';
import { matchingMachine } from '../../workflow/transitions/matching.transitions.js';
import { MATCHING_ERRORS } from '../../constants/errorCodes.js';
import { checkCompatibility } from '../engines/compatibilityEngine.js';
import { checkEligibility } from '../engines/eligibilityEngine.js';
import { scoreRecipients } from '../engines/scoringEngine.js';
import { recommendMatches } from '../engines/recommendationEngine.js';
import { eventBus } from '../../domain/events/index.js';
import { MATCHING_EVENTS } from '../../domain/events/matching.events.js';
import logger from '../../logger/index.js';

const generateMatchId = () => {
  return `MAT-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
};

/**
 * Orchestrates the full matching run for a given organ.
 */
export const runMatching = async (organId, actorId = 'SYSTEM') => {
  const organ = await Organ.findById(organId).populate({
    path: 'donorId',
    populate: { path: 'hospitalId' }
  });

  if (!organ) throw MATCHING_ERRORS.NOT_FOUND;
  if (organ.status !== 'AWAITING_ALLOCATION') throw MATCHING_ERRORS.INVALID_ORGAN_STATE;

  const matchId = generateMatchId();
  
  // 1. MATCHING_STARTED
  let match = await Match.create({
    matchId,
    organId: organ._id,
    status: 'MATCHING_STARTED',
    createdBy: actorId,
  });

  eventBus.emit(MATCHING_EVENTS.MATCHING_STARTED, { matchId: match.matchId, organId: organ.organId });
  logger.info(`MATCHING_STARTED: ${match.matchId} for Organ ${organ.organId}`);

  try {
    // 2. COMPATIBILITY_CHECK
    match.status = matchingMachine.transition(match.status, 'checkCompatibility');
    const allRecipients = await Recipient.find({}).populate('hospitalId');
    const compatibleRecipients = checkCompatibility(organ, allRecipients);

    // 3. SCORING (which internally includes Eligibility)
    match.status = matchingMachine.transition(match.status, 'score');
    const eligibleRecipients = checkEligibility(compatibleRecipients);
    const scoredRecipients = scoreRecipients(organ, eligibleRecipients);

    // 4. RANKED
    match.status = matchingMachine.transition(match.status, 'rank');
    
    // 5. RECOMMENDED
    match.status = matchingMachine.transition(match.status, 'recommend');
    const topMatches = recommendMatches(scoredRecipients, 5); // top 5 recommendations

    match.recommendedRecipients = topMatches.map(m => ({
      recipientId: m.recipient._id,
      score: m.score,
      breakdown: m.breakdown,
      explanation: m.explanation,
      status: 'PENDING_RESPONSE'
    }));

    await match.save();
    
    if (topMatches.length > 0) {
      eventBus.emit(MATCHING_EVENTS.MATCH_FOUND, { matchId: match.matchId, recommendationsCount: topMatches.length });
      logger.info(`MATCH_FOUND: ${match.matchId} generated ${topMatches.length} recommendations`);
    } else {
      logger.info(`NO_MATCH_FOUND: ${match.matchId} yielded 0 recommendations`);
    }

    return match;
  } catch (error) {
    logger.error(`MATCHING_FAILED: ${match.matchId} due to ${error.message}`);
    match.status = matchingMachine.transition(match.status, 'cancel');
    await match.save();
    throw error;
  }
};

export const getMatchByOrganId = async (organId) => {
  const match = await Match.findOne({ organId }).populate('recommendedRecipients.recipientId').sort({ createdAt: -1 });
  if (!match) throw MATCHING_ERRORS.NOT_FOUND;
  return match;
};

export const acceptRecommendation = async (matchId, recipientId, actorId) => {
  const match = await Match.findById(matchId);
  if (!match) throw MATCHING_ERRORS.NOT_FOUND;

  const rec = match.recommendedRecipients.find(r => r.recipientId.toString() === recipientId.toString());
  if (!rec) throw MATCHING_ERRORS.RECIPIENT_NOT_FOUND_IN_MATCH;

  // Transition match to accepted
  match.status = matchingMachine.transition(match.status, 'accept');
  match.acceptedRecipientId = recipientId;
  rec.status = 'ACCEPTED';

  // Mark all others as declined (implicit)
  match.recommendedRecipients.forEach(r => {
    if (r.recipientId.toString() !== recipientId.toString()) {
      r.status = 'DECLINED';
    }
  });

  await match.save();

  // Load recipient to get their hospital for allocation
  const recipient = await Recipient.findById(recipientId);
  
  eventBus.emit(MATCHING_EVENTS.MATCH_ACCEPTED, { 
    matchId: match.matchId, 
    organId: match.organId,
    recipientId,
    hospitalId: recipient.hospitalId
  });
  logger.info(`MATCH_ACCEPTED: ${match.matchId} by Actor[${actorId}] for Recipient[${recipientId}]`);

  return match;
};

export const declineRecommendation = async (matchId, recipientId, actorId) => {
  const match = await Match.findById(matchId);
  if (!match) throw MATCHING_ERRORS.NOT_FOUND;

  const rec = match.recommendedRecipients.find(r => r.recipientId.toString() === recipientId.toString());
  if (!rec) throw MATCHING_ERRORS.RECIPIENT_NOT_FOUND_IN_MATCH;

  rec.status = 'DECLINED';
  await match.save();

  eventBus.emit(MATCHING_EVENTS.MATCH_REJECTED, { matchId: match.matchId, recipientId });
  logger.info(`MATCH_REJECTED: ${match.matchId} declined Recipient[${recipientId}] by Actor[${actorId}]`);

  return match;
};

// Event Listeners (This would normally be in a separate file like matching.listeners.js but we can map it here or in app bootstrap)
eventBus.on('organ.available', async (payload) => {
  try {
    logger.info(`Event Received: organ.available for Organ[${payload.organId}]`);
    await runMatching(payload.organId, 'EVENT_BUS');
  } catch (err) {
    logger.error(`Error processing organ.available event: ${err.message}`);
  }
});
