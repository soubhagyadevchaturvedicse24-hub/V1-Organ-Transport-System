import Recipient from '../../models/Recipient.js';

// Minimal CRUD for testing matching engine

export const createRecipient = async (req, res, next) => {
  try {
    const recipientId = `REC-${Date.now().toString().slice(-6)}`;
    const recipient = await Recipient.create({ ...req.body, recipientId });
    res.status(201).json(recipient);
  } catch (error) {
    next(error);
  }
};

export const listRecipients = async (req, res, next) => {
  try {
    const recipients = await Recipient.find().populate('hospitalId');
    res.status(200).json(recipients);
  } catch (error) {
    next(error);
  }
};
