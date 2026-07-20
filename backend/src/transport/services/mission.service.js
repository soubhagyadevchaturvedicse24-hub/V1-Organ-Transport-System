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
  mission.chainOfCustody.push({
    actorId,
    action: action.toUpperCase(),
    location: locationInfo,
  });

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
