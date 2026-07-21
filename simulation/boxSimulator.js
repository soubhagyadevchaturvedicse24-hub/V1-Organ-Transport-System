const crypto = require('crypto');

// Configuration Parameters
const GATEWAY_URL = 'http://localhost:5000/api/telemetry/ingress';
const DEVICE_ID = 'BOX-2026-FABRIC-ALPHA';
const EMULATION_INTERVAL_MS = 5000;

// Generate cryptographic secp256k1 curve parameters to simulate onboard chip architectures
console.log('Initializing Secure Edge Cryptography Core Partition...');
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'secp256k1'
});

// Structural helper tool to format keys into uncompressed hex parameters strings
const publicKeyHex = publicKey.export({ type: 'spki', format: 'pem' });
console.log('Device Public Key Manifest Generated Successfully:\n', publicKeyHex.substring(0, 150) + '...[TRUNCATED]');

// Bootstrapping: Register public key dynamically to backend on startup
const registerDeviceKey = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/device/register-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deviceId: DEVICE_ID,
        publicKey: publicKeyHex
      })
    });
    const data = await res.json().catch(() => ({}));
    console.log('Device Public Key Registered to Gateway:', res.status, data);
  } catch (error) {
    console.error('Inbound Traffic Processing Blocked by Gateway Firewall (Registration):', error.message);
  }
};

/**
 * Generates varying telemetry tracking conditions matching clinical organ baselines
 * @param {number} loopTick Step iteration counter to emulate anomalies over timeline
 */
function compileSensorArrayMetrics(loopTick) {
  let temperature = 4.2; // Default optimal setting matching rule baselines (4 C)
  let vibration = 0.08; // Safe transport baseline movement force
  let reedLatch = 1; // 1 = Securely Closed, 0 = Tampered/Opened
  
  // Inject automated operational anomalies over timeline steps to test software traps
  if (loopTick > 6 && loopTick < 12) {
    // Step iteration condition simulating a yellow warning tier transition boundary
    temperature = 5.8;
    vibration = 0.45;
  } else if (loopTick >= 12) {
    // Step iteration condition simulating a severe red SLA alert tamper crash boundary
    temperature = 8.4;
    vibration = 2.10; // Exceeds safe 1.8G thresholds
    reedLatch = 0; // Simulates a lid-opening break attempt
  }
  
  return {
    deviceId: DEVICE_ID,
    timestamp: Math.floor(Date.now() / 1000),
    telemetry: {
      temperature: parseFloat((temperature + (Math.random() * 0.4 - 0.2)).toFixed(2)),
      vibration_g: parseFloat((vibration + (Math.random() * 0.05)).toFixed(2)),
      reed_latch: reedLatch
    },
    gps: {
      latitude: parseFloat((19.0760 + (loopTick * 0.0015)).toFixed(6)),
      longitude: parseFloat((72.8777 + (loopTick * 0.0022)).toFixed(6))
    }
  };
}

let tickCounter = 0;
console.log(`Starting Telemetry Stream Loop. Interval Frequency: ${EMULATION_INTERVAL_MS}ms...`);

const startLoop = () => {
  setInterval(async () => {
    tickCounter++;
    // Initialize data payload
    const dataManifest = compileSensorArrayMetrics(tickCounter);
    const dataStringPayload = JSON.stringify(dataManifest);
    
    // Cryptographic Step 1: Calculate Payload Hash Fingerprint
    const payloadHash = crypto.createHash('sha256').update(dataStringPayload).digest();
    // Cryptographic Step 2: Sign Hash Fingerprint using Private Key File
    const hardwareSignature = crypto.sign('SHA-256', payloadHash, privateKey);
    const signatureHex = hardwareSignature.toString('hex');
    
    // Attach parameters directly to request structures
    const requestHeaders = {
      'Content-Type': 'application/json',
      'x-device-id': DEVICE_ID,
      'x-device-signature': signatureHex
    };
    
    try {
      console.log(`\n[Tick #${tickCounter}] Transmitting Simulated Telemetry Envelope...`);
      const response = await fetch(GATEWAY_URL, {
        method: 'POST',
        headers: requestHeaders,
        body: dataStringPayload
      });
      const data = await response.json().catch(() => ({}));
      console.log('Ingress Gateway Response Status:', response.status, data);
    } catch (error) {
      console.error('Inbound Traffic Processing Blocked by Gateway Firewall:', error.message);
    }
  }, EMULATION_INTERVAL_MS);
};

// Bootstrap key registration first, then run simulation loop
registerDeviceKey().then(startLoop);
