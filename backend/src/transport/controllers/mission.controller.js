import * as missionService from '../services/mission.service.js';

export const createMission = async (req, res, next) => {
  try {
    const mission = await missionService.createMission(req.body, req.user.sub);
    res.status(201).json(mission);
  } catch (error) {
    next(error);
  }
};

export const updateMissionWorkflow = async (req, res, next) => {
  try {
    const { action } = req.params;
    const locationInfo = req.body.location || {};
    const mission = await missionService.updateMissionWorkflow(req.params.missionId, action, req.user.sub, locationInfo);
    res.status(200).json(mission);
  } catch (error) {
    next(error);
  }
};

export const getMission = async (req, res, next) => {
  try {
    const mission = await missionService.getMissionById(req.params.missionId);
    res.status(200).json({ success: true, data: { mission } });
  } catch (error) {
    next(error);
  }
};

export const listMissions = async (req, res, next) => {
  try {
    const result = await missionService.listMissions();
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getActiveShipments = async (req, res, next) => {
  try {
    const shipments = await missionService.getActiveShipments();
    res.status(200).json(shipments);
  } catch (error) {
    next(error);
  }
};
