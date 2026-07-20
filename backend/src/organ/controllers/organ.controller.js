import * as organService from '../services/organ.service.js';

export const registerOrgan = async (req, res, next) => {
  try {
    const organ = await organService.registerOrgan(req.body, req.user.sub);
    res.status(201).json(organ);
  } catch (error) {
    next(error);
  }
};

export const listOrgans = async (req, res, next) => {
  try {
    const results = await organService.listOrgans(req.query);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

export const getOrgan = async (req, res, next) => {
  try {
    const organ = await organService.getOrgan(req.params.id);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};

export const updateAssessment = async (req, res, next) => {
  try {
    const organ = await organService.updateAssessment(req.params.id, req.body, req.user.sub);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};

// --- Workflow Actions ---

export const beginAssessment = async (req, res, next) => {
  try {
    const organ = await organService.beginAssessment(req.params.id, req.user.sub);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};

export const approveViability = async (req, res, next) => {
  try {
    const organ = await organService.approveViability(req.params.id, req.user.sub);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};

export const allocateOrgan = async (req, res, next) => {
  try {
    const organ = await organService.allocateOrgan(req.params.id, req.user.sub, req.body.allocatedToHospital);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};

export const dispatchOrgan = async (req, res, next) => {
  try {
    const organ = await organService.dispatchOrgan(req.params.id, req.user.sub, req.body.transportBoxId);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};

export const receiveOrgan = async (req, res, next) => {
  try {
    const organ = await organService.receiveOrgan(req.params.id, req.user.sub);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};

export const discardOrgan = async (req, res, next) => {
  try {
    const organ = await organService.discardOrgan(req.params.id, req.user.sub, req.body.discardReason);
    res.status(200).json(organ);
  } catch (error) {
    next(error);
  }
};
