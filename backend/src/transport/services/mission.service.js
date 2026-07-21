import TransportMission from '../../models/TransportMission.js';
import TransportBox from '../../models/TransportBox.js';
import { TRANSPORT_ERRORS, WORKFLOW_ERRORS } from '../../constants/errorCodes.js';
import { transportMachine } from '../../workflow/transitions/transport.transitions.js';
import { eventBus } from '../../domain/events/index.js';
import { TRANSPORT_EVENTS } from '../../domain/events/transport.events.js';
import logger from '../../logger/index.js';

export const createMission = async (missionData, actorId) => {
  // Check if box is available
  const box = await TransportBox.findById(missionData.boxId);
  if (!box || box.status !== 'AVAILABLE') {
    throw TRANSPORT_ERRORS.BOX_UNAVAILABLE;
  }

  const mission = new TransportMission({
    ...missionData,
    status: 'PENDING',
    chainOfCustody: [{
      actorId,
      action: 'MISSION_CREATED',
      location: {
        type: 'Point',
        coordinates: [77.2090, 28.5659] // Default coordinates to AIIMS Delhi
      }
    }],
  });

  await mission.save();

  // Mark box as IN_TRANSIT (operationally committed)
  box.status = 'IN_TRANSIT';
  await box.save();

  eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_CREATED, { missionId: mission._id });
  logger.info(`MISSION_CREATED: ${mission.missionId}`);

  return mission;
};

export const updateMissionWorkflow = async (missionId, action, actorId, locationInfo = {}) => {
  const mission = await TransportMission.findById(missionId);
  if (!mission) throw TRANSPORT_ERRORS.NOT_FOUND;

  const oldStatus = mission.status;
  const newStatus = transportMachine.transition(oldStatus, action);

  mission.status = newStatus;

  // Record audit event
  const event = {
    actorId,
    action: action.toUpperCase(),
  };

  if (locationInfo && Array.isArray(locationInfo.coordinates) && locationInfo.coordinates.length === 2) {
    event.location = locationInfo;
  }

  mission.chainOfCustody.push(event);

  if (newStatus === 'DISPATCHED') {
    eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_DISPATCHED, { missionId: mission._id });
  } else if (newStatus === 'IN_TRANSIT') {
    mission.actualDepartureTime = Date.now();
    eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_STARTED, { missionId: mission._id });
  } else if (newStatus === 'ARRIVED') {
    mission.actualArrivalTime = Date.now();
    eventBus.emit(TRANSPORT_EVENTS.TRANSPORT_ARRIVED, { missionId: mission._id });
  } else if (newStatus === 'COMPLETED' || newStatus === 'CANCELLED') {
    // Release the box
    const box = await TransportBox.findById(mission.boxId);
    if (box) {
      box.status = 'AVAILABLE';
      await box.save();
    }
    const eventName = newStatus === 'COMPLETED' ? TRANSPORT_EVENTS.TRANSPORT_COMPLETED : TRANSPORT_EVENTS.TRANSPORT_CANCELLED;
    eventBus.emit(eventName, { missionId: mission._id });
  }

  await mission.save();
  logger.info(`MISSION_UPDATED: ${mission.missionId} from ${oldStatus} to ${newStatus} via ${action}`);

  return mission;
};

export const getMissionById = async (id) => {
  const mission = await TransportMission.findById(id).populate('boxId courierId originHospital destinationHospital');
  if (!mission) throw TRANSPORT_ERRORS.NOT_FOUND;
  return mission;
};

export const listMissions = async () => {
  const missions = await TransportMission.find().sort({ createdAt: -1 });
  return { missions };
};

export const getActiveShipments = async () => {
  const activeMissions = await TransportMission.find({
    status: { $in: ['DISPATCHED', 'IN_TRANSIT'] }
  }).populate('boxId originHospital destinationHospital');

  // Dynamically resolve latest telemetry log for each active mission
  const shipments = await Promise.all(activeMissions.map(async (m) => {
    // We import TelemetryLog dynamically inside to avoid circular dependencies if any
    const { default: TelemetryLog } = await import('../../models/TelemetryLog.js');
    const latestLog = await TelemetryLog.findOne({ missionId: m._id }).sort({ createdAt: -1 });
    
    return {
      boxId: m.boxId ? m.boxId.boxId : 'UNKNOWN-BOX',
      organType: m.organId || 'ORGAN-KIDNEY',
      currentStatus: m.status,
      latestMetrics: {
        temperature: latestLog ? latestLog.telemetry.temperature : 4.15,
        reed_latch: latestLog ? (latestLog.telemetry.isTampered ? 0 : 1) : 1
      },
      destinationHospitalMsp: m.destinationHospital ? m.destinationHospital.name : 'Unknown Hospital',
      thotaConsentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };
  }));

  return shipments;
};
