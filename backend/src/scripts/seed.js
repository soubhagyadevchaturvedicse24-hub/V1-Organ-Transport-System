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
import User from '../models/User.js';
import Recipient from '../models/Recipient.js';
import { initializeAuditSubscriber, getBlockchainAdapter } from '../blockchain/subscribers/audit.subscriber.js';
import * as matchingService from '../matching/services/matching.service.js';
import * as boxService from '../transport/services/box.service.js';
import * as missionService from '../transport/services/mission.service.js';

dotenv.config();

export const seedData = async () => {
  try {
    // We only connect and initialize subscriber if running standalone
    // For programmatic use, they should be initialized already.

    // 0. Create Users
    console.log('👥 Seeding Users...');
    const adminUser = await User.create({
      email: 'admin@platform.com',
      password: 'admin123admin', // minlength 12
      displayName: 'System Executive',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE'
    });
    const platformAdminId = adminUser._id.toString();

    const courierUser = await User.create({
      email: 'courier@transport.com',
      password: 'courier123courier',
      displayName: 'Courier 7-Alpha',
      role: 'COURIER',
      status: 'ACTIVE'
    });
    const courierId = courierUser._id.toString();

    const hospitalUser = await User.create({
      email: 'contact@aiims.edu',
      password: 'aiims123aiims',
      displayName: 'Dr. Sarah Jenkins',
      role: 'HOSPITAL_COORDINATOR',
      status: 'ACTIVE'
    });

    // 1. Create Hospitals
    console.log('🏥 Seeding Hospitals...');
    const h1 = await Hospital.create({
      hospitalCode: 'HOS-DEL-0001',
      name: 'AIIMS New Delhi',
      licenseNumber: 'LIC-0001',
      licenseExpiry: new Date('2030-01-01'),
      status: 'ACTIVE',
      region: 'NORTH',
      state: 'Delhi',
      geoLocation: { type: 'Point', coordinates: [77.2090, 28.5659] },
      createdBy: platformAdminId,
      contact: { email: 'contact@aiims.edu', phone: '9876543210' },
      address: { street: 'Ansari Nagar', city: 'New Delhi', state: 'Delhi', pincode: '110029' },
      hospitalType: 'GOVERNMENT',
      registrationNumber: 'REG-AIIMS-01',
      transplantCapabilities: ['KIDNEY', 'LIVER']
    });
 
    const h2 = await Hospital.create({
      hospitalCode: 'HOS-MUM-0002',
      name: 'Tata Memorial Mumbai',
      licenseNumber: 'LIC-0002',
      licenseExpiry: new Date('2030-01-01'),
      status: 'ACTIVE',
      region: 'WEST',
      state: 'Maharashtra',
      geoLocation: { type: 'Point', coordinates: [72.8427, 19.0069] },
      createdBy: platformAdminId,
      contact: { email: 'info@tmc.gov.in', phone: '8765432109' },
      address: { street: 'Dr E Borges Road', city: 'Mumbai', state: 'Maharashtra', pincode: '400012' },
      hospitalType: 'GOVERNMENT',
      registrationNumber: 'REG-TMC-02',
      transplantCapabilities: ['KIDNEY', 'LIVER']
    });

    // 2. Create Donor
    console.log('👤 Seeding Donors...');
    const donor = await Donor.create({
      donorId: 'DON-2026-001',
      donorType: 'DECEASED',
      hospitalId: h1._id,
      bloodGroup: 'O+',
      age: 35,
      gender: 'MALE',
      weight: 75,
      height: 180,
      status: 'AVAILABLE',
      medicalSummary: 'Healthy donor, cleared for transplant.',
      createdBy: platformAdminId,
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
      organType: 'KIDNEY',
      bloodGroup: 'O+',
      status: 'AWAITING_ALLOCATION',
      medicalAssessment: {
        viabilityStatus: 'VIABLE',
        coldIschemiaTimeLimit: 24,
        qualityAssessment: 'Healthy kidney'
      },
      createdBy: platformAdminId,
    });
    
    // Seed blockchain blocks for organ
    const ledger = getBlockchainAdapter();
    await ledger.append('ORGAN_REGISTERED', 'Organ', organ.organId, { organType: 'KIDNEY', bloodGroup: 'O+' });
    await ledger.append('ORGAN_ASSESSMENT_STARTED', 'Organ', organ.organId, { assessedBy: 'AIIMS Medical Board' });
    await ledger.append('ORGAN_VIABILITY_APPROVED', 'Organ', organ.organId, { viabilityStatus: 'VIABLE' });
    
    await new Promise(r => setTimeout(r, 100));

    // 4. Create Recipients using proper model
    const recipient = await Recipient.create({
      recipientId: 'REC-2026-001',
      hospitalId: h2._id,
      bloodGroup: 'O+',
      requiredOrganType: 'KIDNEY',
      age: 42,
      urgencyLevel: 'EMERGENCY',
      waitlistDate: new Date(),
      status: 'ACTIVE',
      geoLocation: { type: 'Point', coordinates: [72.8427, 19.0069] }, // Tata Memorial Mumbai
    });
    
    await new Promise(r => setTimeout(r, 100));

    // 5. Generate Match
    console.log('🤝 Generating Match...');
    const matchRecord = await matchingService.runMatching(organ._id.toString(), platformAdminId);
    
    // We get the top recommendation
    const topRecommendation = matchRecord.recommendedRecipients[0];
    let match = null;

    if (topRecommendation) {
      console.log('✅ Match accepted...');
      match = await matchingService.acceptRecommendation(matchRecord._id.toString(), topRecommendation.recipientId, platformAdminId);
    }
    
    await new Promise(r => setTimeout(r, 100));

    // 6. Create Transport Box
    console.log('📦 Seeding Transport Boxes...');
    const box = await boxService.registerBox({
      boxId: 'BOX-2026-001',
      deviceId: 'HW-MAC-001',
      deviceSecret: 'secret123',
      lastKnownLocation: { type: 'Point', coordinates: [77.2090, 28.5659] }
    });

    const specBox = await boxService.registerBox({
      boxId: 'BOX-2026-FABRIC-ALPHA',
      deviceId: 'BOX-2026-FABRIC-ALPHA',
      deviceSecret: 'secret123',
      lastKnownLocation: { type: 'Point', coordinates: [77.2090, 28.5659] }
    });

    await new Promise(r => setTimeout(r, 100)); 

    // 7. Create Mission & Dispatch
    if (match) {
      console.log('🚁 Creating & Dispatching Mission...');
      const mission = await missionService.createMission({
        missionId: 'TRN-2026-001',
        organId: organ._id.toString(),
        matchId: match._id.toString(),
        boxId: specBox._id.toString(), // Use specBox so simulator targets it
        courierId,
        originHospital: h1._id.toString(),
        destinationHospital: h2._id.toString(),
      }, platformAdminId);

      await new Promise(r => setTimeout(r, 150));
      await ledger.append('ORGAN_ALLOCATED', 'Organ', organ.organId, { allocatedToHospital: h2.hospitalCode, matchId: match._id.toString() });

      await new Promise(r => setTimeout(r, 150));

      await missionService.updateMissionWorkflow(mission._id.toString(), 'dispatch', platformAdminId);
      
      await new Promise(r => setTimeout(r, 100));
      
      await missionService.updateMissionWorkflow(mission._id.toString(), 'startTransit', courierId, { lat: 28.56, lng: 77.20 });

      await new Promise(r => setTimeout(r, 150));
      await ledger.append('ORGAN_DISPATCHED', 'Organ', organ.organId, { transportBoxId: specBox.boxId, courierId: courierUser.email });

      console.log('📡 Generating Mock Telemetry for Mission...');
      // Manually trigger some telemetry
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
    
    console.log('\n--- VERIFICATION: COLLECTION COUNTS ---');
    console.log('Hospitals:', await Hospital.countDocuments());
    console.log('Donors:', await Donor.countDocuments());
    console.log('Organs:', await Organ.countDocuments());
    console.log('Matches:', await Match.countDocuments());
    console.log('Transport (Missions):', await TransportMission.countDocuments());
    console.log('Transport (Boxes):', await TransportBox.countDocuments());
    console.log('LedgerBlocks:', await mongoose.connection.collection('ledgerblocks').countDocuments());
    console.log('---------------------------------------\n');

  } catch (error) {
    console.error('❌ Seeder Failed:', error);
    throw error;
  }
};

// Standalone execution
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    try {
      await connectDB();
      initializeAuditSubscriber();
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
        await mongoose.connection.collection('ledgerblocks').deleteMany({});
        await mongoose.connection.collection('telemetrys').deleteMany({});
        await mongoose.connection.collection('recipients').deleteMany({});
        await User.deleteMany({});
        console.log('✅ Collections cleared.');
      }

      await seedData();
      process.exit(0);
    } catch (e) {
      process.exit(1);
    }
  })();
}
