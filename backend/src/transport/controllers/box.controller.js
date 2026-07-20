import * as boxService from '../services/box.service.js';

export const registerBox = async (req, res, next) => {
  try {
    const box = await boxService.registerBox(req.body);
    // Don't leak secret hash in response
    const boxObject = box.toObject();
    delete boxObject.deviceSecretHash;
    res.status(201).json(boxObject);
  } catch (error) {
    next(error);
  }
};

export const listBoxes = async (req, res, next) => {
  try {
    const boxes = await boxService.listBoxes();
    const cleanBoxes = boxes.map(b => {
      const obj = b.toObject();
      delete obj.deviceSecretHash;
      return obj;
    });
    res.status(200).json(cleanBoxes);
  } catch (error) {
    next(error);
  }
};

export const updateBoxStatus = async (req, res, next) => {
  try {
    const box = await boxService.updateBoxStatus(req.params.boxId, req.body.status);
    const boxObject = box.toObject();
    delete boxObject.deviceSecretHash;
    res.status(200).json(boxObject);
  } catch (error) {
    next(error);
  }
};
