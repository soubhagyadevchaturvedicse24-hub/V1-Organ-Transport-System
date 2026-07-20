import crypto from 'crypto';
import BlockchainAdapter from './BlockchainAdapter.js';
import LedgerBlock from '../../models/LedgerBlock.js';
import logger from '../../logger/index.js';

export default class MiniBlockchainAdapter extends BlockchainAdapter {
  
  // Helper to canonicalize objects so hashes are deterministic regardless of key order
  _canonicalStringify(obj) {
    if (obj === null || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return `[${obj.map(item => this._canonicalStringify(item)).join(',')}]`;
    }
    const keys = Object.keys(obj).sort();
    const str = keys.map(k => `${JSON.stringify(k)}:${this._canonicalStringify(obj[k])}`).join(',');
    return `{${str}}`;
  }

  _calculateHash(blockIndex, timestamp, previousHash, eventType, entityType, entityId, payload) {
    const dataString = `${blockIndex}|${timestamp.toISOString()}|${previousHash}|${eventType}|${entityType}|${entityId}|${this._canonicalStringify(payload)}`;
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async append(eventType, entityType, entityId, payload) {
    try {
      const lastBlock = await LedgerBlock.findOne().sort({ blockIndex: -1 });
      const blockIndex = lastBlock ? lastBlock.blockIndex + 1 : 0;
      const previousHash = lastBlock ? lastBlock.hash : '0000000000000000000000000000000000000000000000000000000000000000';
      const timestamp = new Date();

      const hash = this._calculateHash(blockIndex, timestamp, previousHash, eventType, entityType, entityId, payload);

      const block = new LedgerBlock({
        blockIndex,
        timestamp,
        previousHash,
        hash,
        eventType,
        entityType,
        entityId,
        payload,
      });

      await block.save();
      logger.info(`MINI_CHAIN: Block #${blockIndex} appended [${eventType} -> ${entityType}:${entityId}]`);
      return block;
    } catch (error) {
      logger.error(`MINI_CHAIN Error appending block: ${error.message}`);
      throw error;
    }
  }

  async getHistory(entityType, entityId) {
    const blocks = await LedgerBlock.find({ entityType, entityId }).sort({ blockIndex: 1 });
    return blocks.map(b => ({
      blockIndex: b.blockIndex,
      timestamp: b.timestamp,
      eventType: b.eventType,
      payload: b.payload,
      hash: b.hash,
    }));
  }

  async verify() {
    const blocks = await LedgerBlock.find().sort({ blockIndex: 1 });
    
    if (blocks.length === 0) {
      return { valid: true, totalBlocks: 0, verifiedBlocks: 0, brokenBlock: null };
    }

    let previousHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      // Verify sequence
      if (block.blockIndex !== i) {
        return {
          valid: false,
          brokenBlock: block.blockIndex,
          error: `Index mismatch at ${block.blockIndex} (expected ${i})`,
        };
      }

      // Verify previous hash link
      if (block.previousHash !== previousHash) {
        return {
          valid: false,
          brokenBlock: block.blockIndex,
          expectedHash: previousHash,
          actualHash: block.previousHash,
          error: 'previousHash link broken',
        };
      }

      // Verify internal hash
      const expectedSelfHash = this._calculateHash(
        block.blockIndex,
        block.timestamp,
        block.previousHash,
        block.eventType,
        block.entityType,
        block.entityId,
        block.payload
      );

      if (block.hash !== expectedSelfHash) {
        return {
          valid: false,
          brokenBlock: block.blockIndex,
          expectedHash: expectedSelfHash,
          actualHash: block.hash,
          error: 'Block data has been tampered with (hash mismatch)',
        };
      }

      previousHash = block.hash;
    }

    return {
      valid: true,
      totalBlocks: blocks.length,
      verifiedBlocks: blocks.length,
      brokenBlock: null,
    };
  }
}
