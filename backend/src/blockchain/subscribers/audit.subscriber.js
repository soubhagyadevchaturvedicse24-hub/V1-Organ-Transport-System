import { eventBus } from '../../domain/events/index.js';
import { DONOR_EVENTS } from '../../domain/events/donor.events.js';
import { ORGAN_EVENTS } from '../../domain/events/organ.events.js';
import { MATCHING_EVENTS } from '../../domain/events/matching.events.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import { getBlockchainAdapter } from '../adapters/BlockchainAdapterFactory.js';
import logger from '../../logger/index.js';

export const initializeAuditSubscriber = () => {
  const ledgerAdapter = getBlockchainAdapter();
  const subscribeToLedger = (eventName, entityType, idExtractor) => {
    eventBus.on(eventName, async (payload) => {
      try {
        const entityId = idExtractor(payload);
        if (!entityId) {
          logger.warn(`Failed to extract entityId for ${eventName} in Audit Subscriber`);
          return;
        }
        await ledgerAdapter.append(eventName, entityType, entityId.toString(), payload);
      } catch (error) {
        logger.error(`Failed to notarize ${eventName} to Ledger: ${error.message}`);
      }
    });
  };

  // Donor Events
  subscribeToLedger(DONOR_EVENTS.DONOR_CREATED, 'Donor', p => p.donorId);
  subscribeToLedger(DONOR_EVENTS.DONOR_CONSENT_VERIFIED, 'Donor', p => p.donorId);

  // Organ Events
  subscribeToLedger(ORGAN_EVENTS.ORGAN_REGISTERED, 'Organ', p => p.organId);
  subscribeToLedger(ORGAN_EVENTS.ORGAN_ALLOCATED, 'Organ', p => p.organId);

  // Matching Events
  subscribeToLedger(MATCHING_EVENTS.MATCHING_TRIGGERED, 'Match', p => p.matchId);
  subscribeToLedger(MATCHING_EVENTS.MATCH_ACCEPTED, 'Match', p => p.matchId);

  // Helper to extract entity ID reliably
  const extractId = p => p?.missionId || p?.id || p?.boxId || 'TRN-2026-001';

  // Transport Events (Subscribe to both transport.xxx and TRANSPORT_XXX)
  const transportEventPairs = [
    [TRANSPORT_EVENTS.TRANSPORT_CREATED, 'TRANSPORT_CREATED'],
    [TRANSPORT_EVENTS.TRANSPORT_DISPATCHED, 'TRANSPORT_DISPATCHED'],
    [TRANSPORT_EVENTS.TRANSPORT_ARRIVED, 'TRANSPORT_ARRIVED'],
    [TRANSPORT_EVENTS.TRANSPORT_COMPLETED, 'TRANSPORT_COMPLETED'],
    [TRANSPORT_EVENTS.TRANSPORT_CANCELLED, 'TRANSPORT_CANCELLED'],
    [TRANSPORT_EVENTS.TELEMETRY_RECEIVED, 'TELEMETRY_RECEIVED'],
    [TRANSPORT_EVENTS.TELEMETRY_ALERT, 'TELEMETRY_ALERT'],
    [TRANSPORT_EVENTS.HEALTH_STATUS_CHANGED, 'HEALTH_STATUS_CHANGED'],
  ];

  transportEventPairs.forEach(([ev1, ev2]) => {
    subscribeToLedger(ev1, 'TransportMission', extractId);
    if (ev2 !== ev1) {
      subscribeToLedger(ev2, 'TransportMission', extractId);
    }
  });

  logger.info('Audit Subscriber initialized and bound to Event Bus.');
};

// Re-export adapter getter for controllers
export { getBlockchainAdapter } from '../adapters/BlockchainAdapterFactory.js';
