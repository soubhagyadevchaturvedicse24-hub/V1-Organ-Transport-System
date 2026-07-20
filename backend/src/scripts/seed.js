import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Hospital from '../models/Hospital.js';
import Donor from '../models/Donor.js';
import Organ from '../models/Organ.js';
import Match from '../models/Match.js';
import TransportBox from '../models/TransportBox.js';
import TransportMission from '../models/TransportMission.js';
import LedgerBlock from '../models/LedgerBlock.js';
import TelemetryLog from '../models/TelemetryLog.js';
import { initializeAuditSubscriber } from '../blockchain/subscribers/audit.subscriber.js';
import * as matchingService from '../matching/services/matching.service.js';
import * as boxService from '../transport/services/box.service.js';
import * as missionService from '../transport/services/mission.service.js';

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    initializeAuditSubscriber(); // Enables blockchain ledger generation for events
    console.log('🌱 Connected to DB. Starting Seeder...');

    const isReset = process.argv.includes('--reset');
    
    if (isReset) {
      console.log('⚠️ Resetting database collections...');
      await Hospital.deleteMany({});
      await Donor.deleteMany({});
      await Organ.deleteMany({});
      await Match.deleteMany({});
      await TransportBox.deleteMany({});
      await TransportMission.deleteMany({});
      
      // Since LedgerBlock is immutable, native Mongoose throws an error on delete.
      // Bypass using native MongoDB driver:
      await mongoose.connection.collection('ledgerblocks').deleteMany({});
      await mongoose.connection.collection('telemetrys').deleteMany({});
      console.log('✅ Collections cleared.');
    }

    const platformAdminId = new mongoose.Types.ObjectId().toString(); // Mock admin
    const courierId = new mongoose.Types.ObjectId().toString(); // Mock courier

    // 1. Create Hospitals
    console.log('🏥 Seeding Hospitals...');
    const h1 = await Hospital.create({
      hospitalCode: 'HOS-DEL-0001',
      name: 'AIIMS New Delhi',
      licenseNumber: 'LIC-0001',
      licenseExpiry: new Date('2030-01-01'),
      status: 'APPROVED',
      region: 'NORTH',
      state: 'Delhi',
      location: { type: 'Point', coordinates: [77.2090, 28.5659] },
    });

    const h2 = await Hospital.create({
      hospitalCode: 'HOS-MUM-0002',
      name: 'Tata Memorial Mumbai',
      licenseNumber: 'LIC-0002',
      licenseExpiry: new Date('2030-01-01'),
      status: 'APPROVED',
      region: 'WEST',
      state: 'Maharashtra',
      location: { type: 'Point', coordinates: [72.8427, 19.0069] },
    });

    // 2. Create Donor
    console.log('👤 Seeding Donors...');
    const donor = await Donor.create({
      donorId: 'DON-2026-001',
      type: 'DECEASED',
      hospitalId: h1._id,
      demographics: { bloodGroup: 'O+', age: 35, gender: 'MALE', weight: 75, height: 180 },
      status: 'AVAILABLE',
      consent: { verified: true, verifiedAt: new Date(), verifiedBy: platformAdminId },
      medicalAssessment: { isMedicallyFit: true, assessmentDate: new Date(), notes: 'Cleared' },
    });

    // Wait slightly so blockchain timestamps order properly
    await new Promise(r => setTimeout(r, 100)); 

    // 3. Create Organ
    console.log('🫀 Seeding Organs...');
    const organ = await Organ.create({
      organId: 'ORG-KID-001',
      donorId: donor._id,
      hospitalId: h1._id,
      organType: 'KIDNEY',
      bloodGroup: 'O+',
      status: 'AVAILABLE',
      medicalCondition: { isViable: true, ischemiaTimeStart: new Date(), comments: 'Healthy kidney' },
    });
    
    await new Promise(r => setTimeout(r, 100));

    // 4. Create Recipients (Minimal direct DB creation just for matching)
    const recipient = await mongoose.connection.collection('recipients').insertOne({
      recipientId: 'REC-2026-001',
      hospitalId: h2._id,
      bloodGroup: 'O+',
      organRequired: 'KIDNEY',
      status: 'ACTIVE',
      urgencyScore: 85,
    });
    
    await new Promise(r => setTimeout(r, 100));

    // 5. Generate Match
    console.log('🤝 Generating Match...');
    const matches = await matchingService.triggerMatch(organ._id.toString());
    const match = matches[0]; // Take top recommendation

    if (match) {
      console.log('✅ Match accepted...');
      await matchingService.updateMatchStatus(match._id.toString(), 'accept', platformAdminId);
    }
    
    await new Promise(r => setTimeout(r, 100));

    // 6. Create Transport Box
    console.log('📦 Seeding Transport Boxes...');
    const box = await boxService.registerBox({
      boxId: 'BOX-2026-001',
      deviceSecret: 'secret123',
    });

    await new Promise(r => setTimeout(r, 100));

    // 7. Create Mission & Dispatch
    if (match) {
      console.log('🚁 Creating & Dispatching Mission...');
      const mission = await missionService.createMission({
        missionId: 'TRN-2026-001',
        organId: organ._id.toString(),
        matchId: match._id.toString(),
        boxId: box._id.toString(),
        courierId,
        originHospital: h1._id.toString(),
        destinationHospital: h2._id.toString(),
      }, platformAdminId);

      await new Promise(r => setTimeout(r, 100));

      await missionService.updateMissionWorkflow(mission._id.toString(), 'dispatch', platformAdminId);
      
      await new Promise(r => setTimeout(r, 100));
      
      await missionService.updateMissionWorkflow(mission._id.toString(), 'startTransit', courierId, { lat: 28.56, lng: 77.20 });

      console.log('📡 Generating Mock Telemetry for Mission...');
      // Manually trigger some telemetry
      // Instead of the rest client, we can bypass using the collection directly to simulate history
      await mongoose.connection.collection('telemetrys').insertOne({
        boxId: box._id.toString(),
        missionId: mission._id.toString(),
        timestamp: new Date(),
        telemetry: {
          temperature: 4.5,
          batteryLevel: 98,
          geoLocation: { type: 'Point', coordinates: [77.21, 28.55] },
          isTampered: false,
        }
      });
    }

    console.log('🎉 Seed complete! E2E scenario successfully generated.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeder Failed:', error);
    process.exit(1);
  }
};

seedData();
