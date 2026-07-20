import * as hospitalService from '../services/hospital.service.js';
import {
  createHospitalSchema,
  updateHospitalSchema,
  rejectHospitalSchema,
  listHospitalsSchema,
} from '../validators/hospital.validator.js';

const handleValidation = (schema, data) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw { code: 'VALIDATION_001', message: 'Validation failed', status: 400, details: result.error.errors };
  }
  return result.data;
};

export const createHospital = async (req, res, next) => {
  try {
    const data = handleValidation(createHospitalSchema, req.body);
    const hospital = await hospitalService.createHospital(data, req.user.sub);
    res.status(201).json({ success: true, message: 'Hospital created successfully', data: { hospital } });
  } catch (err) { next(err); }
};

export const listHospitals = async (req, res, next) => {
  try {
    const query = handleValidation(listHospitalsSchema, req.query);
    const result = await hospitalService.listHospitals(query);
    res.status(200).json({ success: true, message: 'Hospitals retrieved', data: result });
  } catch (err) { next(err); }
};

export const getHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.getHospital(req.params.id);
    res.status(200).json({ success: true, message: 'Hospital retrieved', data: { hospital } });
  } catch (err) { next(err); }
};

export const updateHospital = async (req, res, next) => {
  try {
    const data = handleValidation(updateHospitalSchema, req.body);
    const hospital = await hospitalService.updateHospital(req.params.id, data);
    res.status(200).json({ success: true, message: 'Hospital updated', data: { hospital } });
  } catch (err) { next(err); }
};

export const submitHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.submitHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital submitted for verification', data: { hospital } });
  } catch (err) { next(err); }
};

export const approveHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.approveHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital approved', data: { hospital } });
  } catch (err) { next(err); }
};

export const rejectHospital = async (req, res, next) => {
  try {
    const { rejectionReason } = handleValidation(rejectHospitalSchema, req.body);
    const hospital = await hospitalService.rejectHospital(req.params.id, req.user.sub, rejectionReason);
    res.status(200).json({ success: true, message: 'Hospital rejected', data: { hospital } });
  } catch (err) { next(err); }
};

export const activateHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.activateHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital activated', data: { hospital } });
  } catch (err) { next(err); }
};

export const suspendHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.suspendHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital suspended', data: { hospital } });
  } catch (err) { next(err); }
};

export const reactivateHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.reactivateHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital reactivated', data: { hospital } });
  } catch (err) { next(err); }
};

export const deactivateHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.deactivateHospital(req.params.id, req.user.sub);
    res.status(200).json({ success: true, message: 'Hospital deactivated', data: { hospital } });
  } catch (err) { next(err); }
};
