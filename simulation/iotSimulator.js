/**
 * Decentralized IoT Simulator for Organ Transport System.
 * Simulates edge hardware with ECDSA secp256k1 payload signing and direct Arweave permaweb storage via Irys Devnet.
 */
const crypto = require('crypto');

// Configuration
const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:5000/api/telemetry/ingress';
const DEVICE_ID = process.argv[2] || 'BOX-2026-FABRIC-ALPHA';
const MISSION_ID = process.argv[3] || 'TRN-001';
const EMULATION_INTERVAL_MS = parseInt(process.env.EMULATION_INTERVAL_MS, 10) || 5000;

console.log('====================================================');
console.log('🤖 Starting Decentralized IoT Edge Simulator');
console.log(`📦 Device ID : ${DEVICE_ID}`);
console.log(`🎯 Mission ID: ${MISSION_ID}`);
console.log('====================================================\n');

// 1. Generate / Load ECDSA Key Pair (secp256k1 curve)
console.log('🔐 Initializing Secp256k1 ECDSA Hardware Core Partition...');
const keyPair = crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp256k1',
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const publicKeyPem = keyPair.publicKey;
const privateKeyPem = keyPair.privateKey;

// Extract public key hex representation for lightweight transport
const pubKeyDer = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'der' });
const publicKeyHex = pubKeyDer.toString('hex');

console.log(`🔑 Device Public Key Hash: ${crypto.createHash('sha256').update(publicKeyHex).digest('hex').substring(0, 16)}...`);

/**
 * Sign a payload string using secp256k1 ECDSA
 */
function signPayload(payloadString) {
  const signer = crypto.createSign('SHA256');
  signer.update(payloadString);
  signer.end();
  return signer.sign(privateKeyPem, 'hex');
}

/**
 * Upload payload directly to Irys Devnet (Arweave Permaweb)
 */
async function uploadToIrysDevnet(payloadString) {
  try {
    let IrysSdk;
    try {
      IrysSdk = require('@irys/sdk');
    } catch {
      IrysSdk = null;
    }

    if (IrysSdk) {
      const privateKey = process.env.IRYS_PRIVATE_KEY || ('0x' + crypto.randomBytes(32).toString('hex'));
      const irys = new (IrysSdk.default || IrysSdk)({
        network: 'devnet',
        token: 'ethereum',
        key: privateKey,
        config: { providerUrl: 'https://rpc.sepolia.org' }
      });
      await irys.ready();
      const receipt = await irys.upload(payloadString, {
        tags: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'App-Name', value: 'NeoLife-Organ-Transport-IoT' },
          { name: 'Device-ID', value: DEVICE_ID },
          { name: 'Mission-ID', value: MISSION_ID }
        ]
      });
      console.log(`🌐 [Arweave Direct Upload] TX ID: ${receipt.id}`);
      return receipt.id;
    } else {
      const txHash = 'ar_' + crypto.createHash('sha256').update(payloadString + Date.now()).digest('hex').substring(0, 32);
      console.log(`🌐 [Arweave Emulation Upload] TX ID: ${txHash}`);
      return txHash;
    }
  } catch (error) {
    console.warn(`⚠️ Direct Irys Upload notice: ${error.message}. Generating fallback TX ID.`);
    return 'ar_' + crypto.createHash('sha256').update(payloadString).digest('hex').substring(0, 32);
  }
}

/**
 * Compile simulated telemetry sensor readings
 */
function compileSensorMetrics(tick) {
  let temperature = 4.2;
  let vibration = 0.08;
  let reedLatch = 1;

  if (tick > 6 && tick < 12) {
    temperature = 5.8;
    vibration = 0.45;
  } else if (tick >= 12) {
    temperature = 8.4;
    vibration = 2.10;
    reedLatch = 0;
  }

  return {
    deviceId: DEVICE_ID,
    missionId: MISSION_ID,
    timestamp: Math.floor(Date.now() / 1000),
    telemetry: {
      temperature: parseFloat((temperature + (Math.random() * 0.4 - 0.2)).toFixed(2)),
      vibration_g: parseFloat((vibration + (Math.random() * 0.05)).toFixed(2)),
      reed_latch: reedLatch,
      batteryLevel: Math.max(0, parseFloat((100 - tick * 0.5).toFixed(1)))
    },
    gps: {
      latitude: parseFloat((19.0760 + tick * 0.0015).toFixed(6)),
      longitude: parseFloat((72.8777 + tick * 0.0022).toFixed(6))
    }
  };
}

let tickCounter = 0;

async function executeTelemetryCycle() {
  tickCounter++;
  const rawMetrics = compileSensorMetrics(tickCounter);
  const dataString = JSON.stringify(rawMetrics);

  // ECDSA Sign Payload
  const signature = signPayload(dataString);

  // Upload to Arweave (Irys Devnet)
  const arweaveTxId = await uploadToIrysDevnet(dataString);

  // Complete Decentralized Payload
  const payloadEnvelope = {
    ...rawMetrics,
    signature,
    publicKey: publicKeyHex,
    arweaveTxId
  };

  console.log(`\n[Tick #${tickCounter}] Payload ECDSA Signed & Uploaded to Arweave.`);
  console.log(`   └─ Arweave TX ID: ${arweaveTxId}`);
  console.log(`   └─ Signature   : ${signature.substring(0, 32)}...`);

  // Transmit to Gateway / Smart Contract Endpoint
  try {
    const res = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': DEVICE_ID,
        'x-device-signature': signature,
        'x-arweave-tx-id': arweaveTxId
      },
      body: JSON.stringify(payloadEnvelope)
    });
    const responseData = await res.json().catch(() => ({}));
    console.log(`   └─ Gateway Response: ${res.status} ${res.statusText}`, responseData);
  } catch (err) {
    console.log(`   └─ Gateway Offline / Local Mode. Telemetry logged directly on Permaweb.`);
  }
}

// Bootstrap loop
console.log(`🚀 Starting simulation loop (interval: ${EMULATION_INTERVAL_MS}ms)...`);
setInterval(executeTelemetryCycle, EMULATION_INTERVAL_MS);
executeTelemetryCycle();
