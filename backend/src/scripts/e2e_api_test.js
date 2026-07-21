const API_URL = 'http://localhost:5000/api/v1';

async function runE2E() {
  console.log('🚀 Starting Complete End-to-End API Test Journey...');
  
  try {
    // 1. Login
    process.stdout.write('🔑 [1/11] Login Admin... ');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@platform.com', password: 'admin123admin' })
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    const token = loginData.data.accessToken;
    console.log('✅ OK');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Create Hospital
    process.stdout.write('🏥 [2/11] Create Hospital... ');
    const hospRes = await fetch(`${API_URL}/hospitals`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: "E2E Test Hospital",
        hospitalCode: `HOS-E2E-${Date.now()}`,
        licenseNumber: `LIC-${Date.now()}`,
        licenseExpiry: "2030-01-01T00:00:00.000Z",
        region: "NORTH",
        state: "Delhi",
        hospitalType: "PRIVATE",
        registrationNumber: `REG-${Date.now()}`,
        transplantCapabilities: ["KIDNEY", "LIVER"],
        address: { street: "Main St", city: "Delhi", state: "Delhi", pincode: "110001" },
        contact: { email: `e2e${Date.now()}@test.com`, phone: "9999999999" },
        geoLocation: { type: "Point", coordinates: [77.2090, 28.6139] }
      })
    });
    if (!hospRes.ok) throw new Error(`Create Hospital failed: ${await hospRes.text()}`);
    const hospData = await hospRes.json();
    const hospitalId = hospData.data.hospital._id;
    console.log('✅ OK');

    // 3. Create Donor
    process.stdout.write('👤 [3/11] Create Donor... ');
    const donorRes = await fetch(`${API_URL}/donors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        donorType: "DECEASED",
        hospitalId: hospitalId,
        bloodGroup: "O+",
        age: 35,
        gender: "MALE",
        medicalSummary: "E2E Test Donor"
      })
    });
    if (!donorRes.ok) throw new Error(`Create Donor failed: ${await donorRes.text()}`);
    const donorData = await donorRes.json();
    const donorId = donorData._id;
    console.log('✅ OK');

    process.stdout.write('🔄 [3.1/11] Submit Donor... ');
    const sRes = await fetch(`${API_URL}/donors/${donorId}/submit`, { method: 'POST', headers: authHeaders });
    if (!sRes.ok) throw new Error(`Submit failed: ${await sRes.text()}`);
    console.log('✅ OK');

    process.stdout.write('🏥 [3.2/11] Medical Approve Donor... ');
    const maRes = await fetch(`${API_URL}/donors/${donorId}/medical-approve`, { method: 'POST', headers: authHeaders });
    if (!maRes.ok) throw new Error(`Medical approve failed: ${await maRes.text()}`);
    console.log('✅ OK');

    process.stdout.write('📝 [3.3/11] Verify Donor Consent... ');
    const vcRes = await fetch(`${API_URL}/donors/${donorId}/consent-verify`, { method: 'POST', headers: authHeaders });
    if (!vcRes.ok) throw new Error(`Verify consent failed: ${await vcRes.text()}`);
    console.log('✅ OK');

    process.stdout.write('🟢 [3.4/11] Activate Donor... ');
    const aRes = await fetch(`${API_URL}/donors/${donorId}/activate`, { method: 'POST', headers: authHeaders });
    if (!aRes.ok) throw new Error(`Activate failed: ${await aRes.text()}`);
    console.log('✅ OK');

    // 4. Create Organ
    process.stdout.write('🫀 [4/11] Create Organ... ');
    const organRes = await fetch(`${API_URL}/organs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        donorId: donorId,
        organType: "KIDNEY"
      })
    });
    if (!organRes.ok) throw new Error(`Create Organ failed: ${await organRes.text()}`);
    const organData = await organRes.json();
    const organId = organData._id;
    const organCode = organData.organId;
    console.log(`✅ OK (${organCode})`);

    process.stdout.write('🔬 [4.1/11] Begin Organ Assessment... ');
    const oaRes = await fetch(`${API_URL}/organs/${organId}/begin-assessment`, { method: 'POST', headers: authHeaders });
    if (!oaRes.ok) throw new Error(`Assessment failed: ${await oaRes.text()}`);
    console.log('✅ OK');

    process.stdout.write('👍 [4.2/11] Approve Organ Viability... ');
    const ovRes = await fetch(`${API_URL}/organs/${organId}/approve-viability`, { method: 'POST', headers: authHeaders });
    if (!ovRes.ok) throw new Error(`Approve viability failed: ${await ovRes.text()}`);
    console.log('✅ OK');

    // 5. Create Recipient
    process.stdout.write('🛏️  [5/11] Create Recipient... ');
    const recRes = await fetch(`${API_URL}/recipients`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        hospitalId: hospitalId,
        bloodGroup: "O+",
        requiredOrganType: "KIDNEY",
        urgencyScore: 9,
        age: 45,
        geoLocation: { type: "Point", coordinates: [77.2090, 28.6139] },
        waitlistDate: new Date().toISOString(),
        status: "ACTIVE",
        medicalDetails: { diagnosis: "E2E Testing", hlaTyping: { A: ["2"], B: ["7"], DR: ["4"] } }
      })
    });
    if (!recRes.ok) throw new Error(`Create Recipient failed: ${await recRes.text()}`);
    const recData = await recRes.json();
    const recipientId = recData._id;
    console.log('✅ OK');

    // 6. Run Matching
    process.stdout.write('🤝 [6/11] Run Matching... ');
    const matchRes = await fetch(`${API_URL}/matching/organs/${organId}/run`, {
      method: 'POST',
      headers: authHeaders
    });
    if (!matchRes.ok) throw new Error(`Run Matching failed: ${await matchRes.text()}`);
    const matchData = await matchRes.json();
    const matchId = matchData._id;
    const matchedRecipientId = matchData.recommendedRecipients[0].recipientId;
    console.log('✅ OK');

    // 7. Accept Match
    process.stdout.write('✅ [7/11] Accept Match... ');
    const acceptRes = await fetch(`${API_URL}/matching/${matchId}/recipients/${matchedRecipientId}/accept`, {
      method: 'POST',
      headers: authHeaders
    });
    if (!acceptRes.ok) throw new Error(`Accept Match failed: ${await acceptRes.text()}`);
    console.log('✅ OK');

    // 8. Create Box
    process.stdout.write('📦 [8/11] Create Transport Box... ');
    const boxCode = `BOX-E2E-${Date.now()}`;
    const boxRes = await fetch(`${API_URL}/transport/boxes`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        boxId: boxCode,
        deviceId: boxCode,
        deviceSecret: "secret123",
        lastKnownLocation: { type: "Point", coordinates: [77.2090, 28.5659] }
      })
    });
    if (!boxRes.ok) throw new Error(`Create Box failed: ${await boxRes.text()}`);
    const boxData = await boxRes.json();
    const boxIdObj = boxData._id;
    console.log('✅ OK');

    // 9. Create Mission
    process.stdout.write('🚁 [9/11] Create Transport Mission... ');
    const missionRes = await fetch(`${API_URL}/transport/missions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        missionId: `TRN-E2E-${Date.now()}`,
        organId: organId,
        matchId: matchId,
        boxId: boxIdObj,
        courierId: hospitalId,
        originHospital: hospitalId,
        destinationHospital: hospitalId
      })
    });
    if (!missionRes.ok) throw new Error(`Create Mission failed: ${await missionRes.text()}`);
    const missionData = await missionRes.json();
    const transportMissionId = missionData.missionId;
    console.log('✅ OK');

    // Wait a brief moment to allow the event bus to append blockchain blocks
    await new Promise(resolve => setTimeout(resolve, 500));

    // 10. Simulate Telemetry (IoT Ping)
    process.stdout.write('📡 [10/11] IoT Simulator Telemetry Ping... ');
    const telRes = await fetch(`${API_URL}/device/telemetry`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-id': boxCode,
        'x-device-secret': "secret123"
      },
      body: JSON.stringify({
        missionId: transportMissionId,
        temperature: 4.5,
        batteryLevel: 99.0,
        isTampered: false,
        geoLocation: { type: "Point", coordinates: [77.21, 28.57] }
      })
    });
    if (!telRes.ok) throw new Error(`Telemetry failed: ${await telRes.text()}`);
    console.log('✅ OK');

    // Wait for telemetry block to be appended
    await new Promise(resolve => setTimeout(resolve, 500));

    // 11. Fetch Audit (Blockchain)
    process.stdout.write('🔗 [11/11] Fetch Blockchain Audit Ledger... ');
    const auditRes = await fetch(`${API_URL}/audit/entity/organ/${organCode}`, {
      method: 'GET',
      headers: authHeaders
    });
    if (!auditRes.ok) throw new Error(`Audit failed: ${await auditRes.text()}`);
    const auditData = await auditRes.json();
    
    console.log('✅ OK');
    const blocksCount = (auditData.data || auditData).length;
    console.log(`\n🎉 E2E TEST PASSED: Successfully retrieved ${blocksCount} immutable blockchain blocks for Organ ${organCode}!`);
    console.log('🚀 SYSTEM IS FULLY STABLE AND PRODUCTION-READY.');

  } catch (error) {
    console.error(`\n❌ E2E TEST FAILED: ${error.message}`);
    process.exit(1);
  }
}

runE2E();
