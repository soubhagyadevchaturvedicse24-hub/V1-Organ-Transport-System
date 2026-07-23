import Irys from '@irys/sdk';
import crypto from 'crypto';
import logger from '../logger/index.js';

/**
 * Generates a random EVM private key.
 * This is used ONLY for Devnet testing.
 */
const generateRandomWallet = () => {
    return '0x' + crypto.randomBytes(32).toString('hex');
};

class IrysConnector {
    constructor() {
        this.irys = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        try {
            const privateKey = process.env.IRYS_PRIVATE_KEY || generateRandomWallet();
            // Use Polygon Mumbai/Amoy or Sepolia for devnet
            this.irys = new Irys({
                network: "devnet", // Devnet supports free uploads < 100kb
                token: "ethereum",
                key: privateKey,
                config: { providerUrl: "https://rpc.sepolia.org" }
            });
            this.initialized = true;
            logger.info(`Irys Network connected. Wallet address: ${this.irys.address}`);
        } catch (e) {
            logger.error(`Failed to init Irys: ${e.message}`);
        }
    }

    /**
     * Deep clones and masks PII to maintain CIA (Confidentiality, Integrity, Availability)
     * Hashes sensitive string values using SHA256.
     */
    maskPayload(payload) {
        if (!payload) return payload;
        const masked = JSON.parse(JSON.stringify(payload));
        
        const redact = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            for (let key in obj) {
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    redact(obj[key]);
                } else if (['name', 'phone', 'email', 'address', 'nextOfKinName', 'nextOfKinContact', 'hospitalCode', 'registrationNumber'].includes(key)) {
                    if (obj[key]) {
                        obj[key] = 'MASKED:' + crypto.createHash('sha256').update(String(obj[key])).digest('hex').substring(0, 16);
                    }
                }
            }
        };
        redact(masked);
        return masked;
    }

    /**
     * Uploads the payload to the Arweave Permaweb via Irys.
     * @param {Object} payload 
     * @returns {Promise<string|null>} The TX_ID or null if failed.
     */
    async uploadPayload(payload) {
        if (!this.initialized) await this.init();
        if (!this.irys) {
            logger.warn('Irys is not initialized, skipping upload.');
            return null;
        }

        try {
            const maskedPayload = this.maskPayload(payload);
            const dataToUpload = JSON.stringify(maskedPayload);
            
            // Validate size (devnet free uploads are < 100kb)
            const byteSize = Buffer.byteLength(dataToUpload, 'utf8');
            if (byteSize > 100000) {
                 logger.warn(`Payload too large for free Irys devnet upload: ${byteSize} bytes`);
                 return null;
            }

            const receipt = await this.irys.upload(dataToUpload, {
                tags: [
                    { name: "Content-Type", value: "application/json" },
                    { name: "App-Name", value: "NeoLife-Organ-Transport" }
                ]
            });
            
            logger.info(`[Irys] Permaweb Upload Success: https://gateway.irys.xyz/${receipt.id}`);
            return receipt.id;
        } catch (error) {
            logger.error(`[Irys] Upload Failed: ${error.message}`);
            return null;
        }
    }
}

export default new IrysConnector();
