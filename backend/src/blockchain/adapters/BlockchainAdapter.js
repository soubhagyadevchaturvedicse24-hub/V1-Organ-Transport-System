/**
 * Interface for Blockchain Adapters.
 * This guarantees that we can swap underlying blockchain implementations
 * without altering the business logic or audit subscribers.
 */
export default class BlockchainAdapter {
  /**
   * Appends a new event to the ledger.
   * @param {string} eventType 
   * @param {string} entityType 
   * @param {string} entityId 
   * @param {object} payload 
   * @returns {Promise<object>} The created block or transaction receipt
   */
  async append(eventType, entityType, entityId, payload) {
    throw new Error('Method not implemented.');
  }

  /**
   * Reconstructs the timeline of an entity.
   * @param {string} entityType 
   * @param {string} entityId 
   * @returns {Promise<Array>} Array of historical events
   */
  async getHistory(entityType, entityId) {
    throw new Error('Method not implemented.');
  }

  /**
   * Cryptographically verifies the entire chain.
   * @returns {Promise<object>} e.g. { valid: true, totalBlocks: 10, ... }
   */
  async verify() {
    throw new Error('Method not implemented.');
  }
}
