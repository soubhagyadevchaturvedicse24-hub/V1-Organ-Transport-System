import * as donorService from '../services/donor.service.js';

export const createDonor = async (req, res, next) => {
  try {
    const donor = await donorService.createDonor(req.body, req.user.sub);
    res.status(201).json(donor);
  } catch (error) {
    next(error);
  }
};

export const listDonors = async (req, res, next) => {
  try {
    const results = await donorService.listDonors(req.query);
    res.status(200).json(results);
  } catch (error) {
    next(error);
  }
};

export const getDonor = async (req, res, next) => {
  try {
    const donor = await donorService.getDonor(req.params.id);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

export const updateDonor = async (req, res, next) => {
  try {
    const donor = await donorService.updateDonor(req.params.id, req.body);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

// Workflow actions
export const submitDonor = async (req, res, next) => {
  try {
    const donor = await donorService.submitDonor(req.params.id, req.user.sub);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

export const medicalReviewDonor = async (req, res, next) => {
  try {
    const donor = await donorService.medicalReviewDonor(req.params.id, req.user.sub);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

export const verifyConsentDonor = async (req, res, next) => {
  try {
    const donor = await donorService.verifyConsentDonor(req.params.id, req.user.sub);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

export const activateDonor = async (req, res, next) => {
  try {
    const donor = await donorService.activateDonor(req.params.id, req.user.sub);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

export const rejectDonor = async (req, res, next) => {
  try {
    const donor = await donorService.rejectDonor(req.params.id, req.user.sub, req.body.rejectionReason);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

export const completeDonor = async (req, res, next) => {
  try {
    const donor = await donorService.completeDonor(req.params.id, req.user.sub);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};

export const archiveDonor = async (req, res, next) => {
  try {
    const donor = await donorService.archiveDonor(req.params.id, req.user.sub);
    res.status(200).json(donor);
  } catch (error) {
    next(error);
  }
};
