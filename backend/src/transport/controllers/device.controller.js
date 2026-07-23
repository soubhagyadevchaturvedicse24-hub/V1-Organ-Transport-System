import * as telemetryService from '../services/telemetry.service.js';
import { DEVICE_ERRORS } from '../../constants/errorCodes.js';
import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import { getBlockchainAdapter } from '../../blockchain/adapters/BlockchainAdapterFactory.js';
import { executeSimulatorStep } from '../../simulator/controllers/simulator.controller.js';
import logger from '../../logger/index.js';

export const postTelemetry = async (req, res, next) => {
  try {
    const { missionId, milestone, ...payload } = req.body;
    
    if (!missionId) {
      return next(DEVICE_ERRORS.INVALID_PAYLOAD);
    }

    if (milestone) {
      const map = {
        'TRANSPORT_CREATED': TRANSPORT_EVENTS.TRANSPORT_CREATED,
        'TRANSPORT_DISPATCHED': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
        'TRANSPORT_ARRIVED': TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
        'TRANSPORT_COMPLETED': TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
        'transport.created': TRANSPORT_EVENTS.TRANSPORT_CREATED,
        'transport.dispatched': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
        'transport.arrived': TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
        'transport.completed': TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
      };
      const eventName = map[milestone] || map[milestone?.toUpperCase()];
      if (eventName) {
        eventBus.emit(eventName, {
          missionId,
          boxId: req.device?.boxId || 'BOX-2026-FABRIC-ALPHA',
          timestamp: new Date().toISOString(),
          triggeredBy: 'IoT Simulator',
          milestone,
        });
        
        // Also append directly to blockchain for fail-safe persistence
        try {
          const adapter = getBlockchainAdapter();
          await adapter.append(eventName, 'TransportMission', missionId.toString(), {
            missionId,
            milestone,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          logger.warn(`Blockchain append notice: ${e.message}`);
        }
      }
    }

    const log = await telemetryService.logTelemetry(req.device?.boxId || 'BOX-2026-FABRIC-ALPHA', missionId, payload);
    res.status(201).json({ success: true, timestamp: log.timestamp });
  } catch (error) {
    next(error);
  }
};

export const triggerMilestone = async (req, res, next) => {
  try {
    const { milestone, stepId } = req.body;
    const sId = stepId || milestone;

    const simulatorSteps = [
      'donor_created', 'organ_registered', 'match_accepted',
      'transport_created', 'transport_dispatched', 'telemetry_normal',
      'telemetry_alert', 'transport_arrived', 'transport_completed',
      'DONOR_CREATED', 'ORGAN_REGISTERED', 'MATCH_ACCEPTED'
    ];

    if (sId && simulatorSteps.includes(sId)) {
      req.body.stepId = sId.toLowerCase();
      return executeSimulatorStep(req, res, next);
    }

    const { missionId = 'TRN-2026-001', payload = {} } = req.body;
    const map = {
      'TRANSPORT_CREATED': TRANSPORT_EVENTS.TRANSPORT_CREATED,
      'TRANSPORT_DISPATCHED': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
      'TRANSPORT_ARRIVED': TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
      'TRANSPORT_COMPLETED': TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
      'transport.created': TRANSPORT_EVENTS.TRANSPORT_CREATED,
      'transport.dispatched': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
      'transport.arrived': TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
      'transport.completed': TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
      'created': TRANSPORT_EVENTS.TRANSPORT_CREATED,
      'dispatched': TRANSPORT_EVENTS.TRANSPORT_DISPATCHED,
      'arrived': TRANSPORT_EVENTS.TRANSPORT_ARRIVED,
      'completed': TRANSPORT_EVENTS.TRANSPORT_COMPLETED,
    };

    const eventName = map[milestone] || map[milestone?.toUpperCase()] || milestone;

    // 1. Emit on Event Bus
    eventBus.emit(eventName, {
      missionId,
      boxId: req.device?.boxId || 'BOX-2026-FABRIC-ALPHA',
      timestamp: new Date().toISOString(),
      triggeredBy: 'IoT Simulator',
      milestone,
      ...payload,
    });

    // 2. Direct Write to Blockchain Ledger as Fail-Safe
    let block = null;
    try {
      const adapter = getBlockchainAdapter();
      block = await adapter.append(eventName, 'TransportMission', missionId.toString(), {
        missionId,
        milestone,
        timestamp: new Date().toISOString(),
        ...payload,
      });
    } catch (e) {
      console.error('Direct blockchain write error:', e);
    }

    res.status(201).json({
      success: true,
      milestone,
      eventName,
      blockIndex: block?.blockIndex,
      hash: block?.hash,
    });
  } catch (error) {
    next(error);
  }
};
