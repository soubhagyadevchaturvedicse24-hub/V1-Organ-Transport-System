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
    res.status(200).json(mission);
  } catch (error) {
    next(error);
  }
};
