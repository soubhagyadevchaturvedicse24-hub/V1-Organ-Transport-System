import { getBlockchainAdapter } from '../subscribers/audit.subscriber.js';

export const getEntityHistory = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    
    // Normalize type string to TitleCase if needed, but our events use literal strings like 'Organ', 'Match'.
    // Let's assume the client passes the exact entityType or we can capitalize it.
    const entityType = type.charAt(0).toUpperCase() + type.slice(1);
    
    const adapter = getBlockchainAdapter();
    const history = await adapter.getHistory(entityType, id);
    
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

export const verifyLedger = async (req, res, next) => {
  try {
    const adapter = getBlockchainAdapter();
    const verificationResult = await adapter.verify();
    
    res.status(200).json(verificationResult);
  } catch (error) {
    next(error);
  }
};
