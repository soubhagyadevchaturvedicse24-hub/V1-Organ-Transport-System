import { getBlockchainAdapter } from '../subscribers/audit.subscriber.js';
import crypto from 'crypto';
import LedgerBlock from '../../models/LedgerBlock.js';

export const getEntityHistory = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const entityType = type.charAt(0).toUpperCase() + type.slice(1);
    const adapter = getBlockchainAdapter();
    const history = await adapter.getHistory(entityType, id);
    res.status(200).json(history);
  } catch (error) {
    next(error);
  }
};

export const getAllBlocks = async (req, res, next) => {
  try {
    const blocks = await LedgerBlock.find().sort({ blockIndex: -1 }).limit(200);
    res.status(200).json({ success: true, data: blocks });
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

/**
 * POST /api/v1/audit/notarize
 * Direct blockchain write — used by IoT Simulator sequential workflow.
 * Body: { eventType, entityType, entityId, payload }
 */
export const notarizeBlock = async (req, res, next) => {
  try {
    const { eventType, entityType = 'TransportMission', entityId = 'TRN-2026-001', payload = {} } = req.body;

    if (!eventType) {
      return res.status(400).json({ success: false, message: 'eventType is required' });
    }

    const adapter = getBlockchainAdapter();
    const block = await adapter.append(eventType, entityType, entityId.toString(), payload);

    res.status(201).json({
      success: true,
      block: {
        blockIndex: block.blockIndex,
        hash: block.hash,
        previousHash: block.previousHash,
        eventType: block.eventType,
        timestamp: block.timestamp,
      }
    });
  } catch (error) {
    next(error);
  }
};
