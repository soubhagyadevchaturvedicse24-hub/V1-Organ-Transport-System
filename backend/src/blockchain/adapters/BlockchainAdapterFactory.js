import MiniBlockchainAdapter from './MiniBlockchainAdapter.js';
import FabricBlockchainAdapter from './FabricBlockchainAdapter.js';
import logger from '../../logger/index.js';

let adapterInstance = null;

export class BlockchainAdapterFactory {
  static getAdapter() {
    if (!adapterInstance) {
      const adapterType = (process.env.BLOCKCHAIN_ADAPTER || 'mini').toLowerCase();
      
      if (adapterType === 'fabric' || adapterType === 'hyperledger') {
        logger.info('⛓️ BLOCKCHAIN FACTORY: Initializing Hyperledger Fabric Blockchain Adapter...');
        adapterInstance = new FabricBlockchainAdapter();
      } else {
        logger.info('⛓️ BLOCKCHAIN FACTORY: Initializing Mini Blockchain Adapter...');
        adapterInstance = new MiniBlockchainAdapter();
      }
    }
    return adapterInstance;
  }
}

export const getBlockchainAdapter = () => BlockchainAdapterFactory.getAdapter();
