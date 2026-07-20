import { eventBus } from '../../domain/events/index.js';
import { DONOR_EVENTS } from '../../domain/events/donor.events.js';
import { ORGAN_EVENTS } from '../../domain/events/organ.events.js';
import { MATCHING_EVENTS } from '../../domain/events/matching.events.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import MiniBlockchainAdapter from '../adapters/MiniBlockchainAdapter.js';
import logger from '../../logger/index.js';

const ledgerAdapter = new MiniBlockchainAdapter(); // This is replaceable

export const initializeAuditSubscriber = () => {
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

  // Transport Events
  subscribeToLedger(TRANSPORT_EVENTS.TRANSPORT_CREATED, 'TransportMission', p => p.missionId);
  subscribeToLedger(TRANSPORT_EVENTS.TRANSPORT_DISPATCHED, 'TransportMission', p => p.missionId);
  subscribeToLedger(TRANSPORT_EVENTS.TRANSPORT_ARRIVED, 'TransportMission', p => p.missionId);
  subscribeToLedger(TRANSPORT_EVENTS.TRANSPORT_COMPLETED, 'TransportMission', p => p.missionId);
  subscribeToLedger(TRANSPORT_EVENTS.TRANSPORT_CANCELLED, 'TransportMission', p => p.missionId);
  
  // Health & Telemetry
  subscribeToLedger(TRANSPORT_EVENTS.TELEMETRY_ALERT, 'TransportMission', p => p.missionId);
  subscribeToLedger(TRANSPORT_EVENTS.HEALTH_STATUS_CHANGED, 'TransportMission', p => p.missionId);

  logger.info('Audit Subscriber initialized and bound to Event Bus.');
};

// Also expose adapter directly for controllers if needed
export const getBlockchainAdapter = () => ledgerAdapter;
