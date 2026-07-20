import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MiniBlockchainAdapter from '../src/blockchain/adapters/MiniBlockchainAdapter.js';
import LedgerBlock from '../src/models/LedgerBlock.js';

describe('MiniBlockchainAdapter', () => {
  let mongoServer;
  let adapter;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    adapter = new MiniBlockchainAdapter();
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should append a block and calculate correct hashes', async () => {
    const block = await adapter.append('DONOR_CREATED', 'Donor', 'DON-123', { name: 'John Doe' });
    
    expect(block.blockIndex).toBe(0);
    expect(block.previousHash).toBe('0000000000000000000000000000000000000000000000000000000000000000');
    expect(block.hash).toBeDefined();
    expect(block.eventType).toBe('DONOR_CREATED');
  });

  it('should verify a valid chain', async () => {
    await adapter.append('DONOR_CREATED', 'Donor', 'DON-123', { status: 'DRAFT' });
    await adapter.append('ORGAN_REGISTERED', 'Organ', 'ORG-1', { type: 'KIDNEY' });
    await adapter.append('MATCH_ACCEPTED', 'Match', 'MAT-1', { score: 99 });

    const result = await adapter.verify();
    expect(result.valid).toBe(true);
    expect(result.totalBlocks).toBe(3);
  });

  it('should detect a tampered payload', async () => {
    const block1 = await adapter.append('DONOR_CREATED', 'Donor', 'DON-123', { name: 'John' });
    const block2 = await adapter.append('DONOR_UPDATED', 'Donor', 'DON-123', { name: 'Johnny' });

    // Tamper directly via native driver to bypass mongoose hooks
    await LedgerBlock.collection.updateOne(
      { _id: block1._id },
      { $set: { 'payload.name': 'Hacker' } }
    );

    const result = await adapter.verify();
    expect(result.valid).toBe(false);
    expect(result.brokenBlock).toBe(0);
    expect(result.error).toMatch(/tampered/);
  });

  it('should detect a broken hash link', async () => {
    await adapter.append('DONOR_CREATED', 'Donor', 'DON-123', { name: 'John' });
    const block2 = await adapter.append('DONOR_UPDATED', 'Donor', 'DON-123', { name: 'Johnny' });

    // Tamper directly
    await LedgerBlock.collection.updateOne(
      { _id: block2._id },
      { $set: { previousHash: '1234567890abcdef' } }
    );

    const result = await adapter.verify();
    expect(result.valid).toBe(false);
    expect(result.brokenBlock).toBe(1);
    expect(result.error).toMatch(/link broken/);
  });
});
