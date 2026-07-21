import { getBlockchainAdapter } from '../subscribers/audit.subscriber.js';
import crypto from 'crypto';
import LedgerBlock from '../../models/LedgerBlock.js';

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

export const verifyBlock = async (req, res, next) => {
  try {
    const { blockIndex } = req.params;
    const block = await LedgerBlock.findOne({ blockIndex: parseInt(blockIndex, 10) });
    if (!block) {
      return res.status(404).json({ success: false, message: `Block #${blockIndex} not found` });
    }

    const payloadString = JSON.stringify(block.payload);
    const expectedPayloadSHA256 = crypto.createHash('sha256').update(payloadString).digest('hex');

    res.status(200).json({
      blockNumber: block.blockIndex,
      channelName: 'organchannel',
      transactionId: block.hash,
      smartContractMethod: block.eventType,
      proofs: {
        arweaveTxId: `mock-arweave-${block.hash}`,
        expectedPayloadSHA256,
        timestamp: block.timestamp,
      }
    });
  } catch (error) {
    next(error);
  }
};
