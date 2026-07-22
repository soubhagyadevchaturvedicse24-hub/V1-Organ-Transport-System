import Hospital from '../../models/Hospital.js';
import Donor from '../../models/Donor.js';
import Organ from '../../models/Organ.js';
import Recipient from '../../models/Recipient.js';
import Match from '../../models/Match.js';
import TransportBox from '../../models/TransportBox.js';
import TransportMission from '../../models/TransportMission.js';
import TelemetryLog from '../../models/TelemetryLog.js';
import User from '../../models/User.js';
import { getBlockchainAdapter } from '../../blockchain/adapters/BlockchainAdapterFactory.js';
import { hashDeviceSecret } from '../../transport/services/box.service.js';

// Helper to get or create default seed entities for simulator
const getSimulatorEntities = async () => {
  let admin = await User.findOne({ role: 'PLATFORM_ADMIN' });
  if (!admin) {
    admin = await User.create({
      email: 'admin@platform.com',
      password: 'admin123admin',
      displayName: 'System Executive',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE'
    });
  }

  let h1 = await Hospital.findOne({ hospitalCode: 'HOS-DEL-0001' });
  if (!h1) {
    h1 = await Hospital.create({
      hospitalCode: 'HOS-DEL-0001',
      name: 'AIIMS New Delhi',
      licenseNumber: 'LIC-0001',
      licenseExpiry: new Date('2030-01-01'),
      status: 'ACTIVE',
      region: 'NORTH',
      state: 'Delhi',
      geoLocation: { type: 'Point', coordinates: [77.2090, 28.5659] },
      createdBy: admin._id,
      contact: { email: 'contact@aiims.edu', phone: '9876543210' },
      address: { street: 'Ansari Nagar', city: 'New Delhi', state: 'Delhi', pincode: '110029' },
      hospitalType: 'GOVERNMENT',
      registrationNumber: 'REG-AIIMS-01',
      transplantCapabilities: ['KIDNEY', 'LIVER']
    });
  }

  let h2 = await Hospital.findOne({ hospitalCode: 'HOS-BLR-0002' });
  if (!h2) {
    h2 = await Hospital.create({
      hospitalCode: 'HOS-BLR-0002',
      name: 'NIMHANS Bengaluru',
      licenseNumber: 'LIC-0002',
      licenseExpiry: new Date('2030-01-01'),
      status: 'ACTIVE',
      region: 'SOUTH',
      state: 'Karnataka',
      geoLocation: { type: 'Point', coordinates: [77.5946, 12.9447] },
      createdBy: admin._id,
      contact: { email: 'info@nimhans.ac.in', phone: '8765432109' },
      address: { street: 'Hosur Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560029' },
      hospitalType: 'GOVERNMENT',
      registrationNumber: 'REG-NIMHANS-02',
      transplantCapabilities: ['KIDNEY', 'HEART']
    });
  }

  let box = await TransportBox.findOne({ boxId: 'BOX-2026-FABRIC-ALPHA' });
  if (!box) {
    box = await TransportBox.create({
      boxId: 'BOX-2026-FABRIC-ALPHA',
      deviceId: 'BOX-2026-FABRIC-ALPHA',
      deviceSecretHash: hashDeviceSecret('secret123'),
      status: 'ACTIVE',
      batteryHealth: 100,
      lastKnownLocation: { type: 'Point', coordinates: [77.2090, 28.5659] }
    });
  }

  return { admin, h1, h2, box };
};

export const executeSimulatorStep = async (req, res, next) => {
  try {
    const { stepId, payload = {} } = req.body;
    const adapter = getBlockchainAdapter();
    const { admin, h1, h2, box } = await getSimulatorEntities();

    let resultData = null;
    let eventType = '';
    let entityType = 'TransportMission';
    let entityId = 'TRN-2026-001';

    switch (stepId) {
      case 'donor_created': {
        eventType = 'DONOR_CREATED';
        entityType = 'Donor';
        entityId = 'DON-2026-SIM';

        const donor = await Donor.findOneAndUpdate(
          { donorId: entityId },
          {
            donorId: entityId,
            hospitalId: h1._id,
            donorType: 'DECEASED',
            bloodGroup: 'O+',
            age: 35,
            gender: 'MALE',
            medicalSummary: 'Brain-dead donor, cleared for transplant.',
            status: 'AVAILABLE',
            consent: { consentType: 'FAMILY_AUTHORIZATION', status: 'VERIFIED', verifiedAt: new Date() },
            medicalEligibility: { status: 'ELIGIBLE', assessedBy: admin._id, assessedAt: new Date() },
            createdBy: admin._id,
          },
          { upsert: true, new: true }
        );
        resultData = donor;
        break;
      }

      case 'organ_registered': {
        eventType = 'ORGAN_REGISTERED';
        entityType = 'Organ';
        entityId = 'ORG-2026-SIM';

        let donor = await Donor.findOne({ donorId: 'DON-2026-SIM' });
        if (!donor) {
          donor = await Donor.create({
            donorId: 'DON-2026-SIM',
            hospitalId: h1._id,
            donorType: 'DECEASED',
            bloodGroup: 'O+',
            age: 35,
            gender: 'MALE',
            medicalSummary: 'Brain-dead donor, cleared for transplant.',
            status: 'AVAILABLE',
            createdBy: admin._id,
          });
        }

        const organ = await Organ.findOneAndUpdate(
          { organId: entityId },
          {
            organId: entityId,
            donorId: donor._id,
            organType: 'KIDNEY',
            bloodGroup: 'O+',
            status: 'AWAITING_ALLOCATION',
            medicalAssessment: {
              viabilityStatus: 'VIABLE',
              preservationMethod: 'STATIC_COLD_STORAGE',
              coldIschemiaTimeLimit: 24,
              qualityAssessment: 'High quality kidney organ',
              assessedBy: admin._id,
            },
            createdBy: admin._id,
          },
          { upsert: true, new: true }
        );
        resultData = organ;
        break;
      }

      case 'match_accepted': {
        eventType = 'MATCH_ACCEPTED';
        entityType = 'Match';
        entityId = 'MATCH-2026-SIM';

        const organ = await Organ.findOne({ organId: 'ORG-2026-SIM' });
        
        let recipient = await Recipient.findOne({ recipientId: 'REC-2026-SIM' });
        if (!recipient) {
          recipient = await Recipient.create({
            recipientId: 'REC-2026-SIM',
            hospitalId: h2._id,
            bloodGroup: 'O+',
            requiredOrganType: 'KIDNEY',
            age: 42,
            urgencyLevel: 'EMERGENCY',
            waitlistDate: new Date(),
            status: 'ACTIVE',
            geoLocation: { type: 'Point', coordinates: [77.5946, 12.9447] },
          });
        }

        const match = await Match.findOneAndUpdate(
          { matchId: entityId },
          {
            matchId: entityId,
            organId: organ?._id || box._id,
            status: 'ACCEPTED',
            acceptedRecipientId: recipient._id,
            createdBy: admin._id.toString(),
            recommendedRecipients: [{
              recipientId: recipient._id,
              score: 97.4,
              status: 'ACCEPTED',
              breakdown: { urgency: 40, waitingTime: 30, distance: 27.4 },
              explanation: 'Top compatibility score 97.4%'
            }]
          },
          { upsert: true, new: true }
        );

        if (organ) {
          organ.status = 'ALLOCATED';
          organ.allocation = { allocationStatus: 'ALLOCATED', allocatedToHospital: h2._id };
          await organ.save();
        }

        resultData = match;
        break;
      }

      case 'transport_created': {
        eventType = 'transport.created';
        entityType = 'TransportMission';
        entityId = 'TRN-2026-001';

        const organ = await Organ.findOne({ organId: 'ORG-2026-SIM' });
        const match = await Match.findOne({ matchId: 'MATCH-2026-SIM' });

        const mission = await TransportMission.findOneAndUpdate(
          { missionId: entityId },
          {
            missionId: entityId,
            organId: organ?._id || box._id,
            matchId: match?._id || box._id,
            boxId: box._id,
            courierId: admin._id,
            originHospital: h1._id,
            destinationHospital: h2._id,
            status: 'PENDING',
            health: { status: 'NORMAL', score: 100 },
          },
          { upsert: true, new: true }
        );

        resultData = mission;
        break;
      }

      case 'transport_dispatched': {
        eventType = 'transport.dispatched';
        entityType = 'TransportMission';
        entityId = 'TRN-2026-001';

        const mission = await TransportMission.findOneAndUpdate(
          { missionId: entityId },
          {
            status: 'IN_TRANSIT',
            actualDepartureTime: new Date(),
            $push: {
              chainOfCustody: {
                timestamp: new Date(),
                actorId: admin._id,
                action: 'DISPATCHED',
                location: { type: 'Point', coordinates: [77.2090, 28.5659] }
              }
            }
          },
          { new: true }
        );

        await Organ.findOneAndUpdate(
          { organId: 'ORG-2026-SIM' },
          { status: 'IN_TRANSIT', 'logistics.transportStatus': 'IN_TRANSIT' }
        );

        resultData = mission;
        break;
      }

      case 'telemetry_normal': {
        eventType = 'TELEMETRY_RECEIVED';
        entityType = 'TransportMission';
        entityId = 'TRN-2026-001';

        const mission = await TransportMission.findOne({ missionId: entityId });
        await TelemetryLog.create({
          missionId: mission?._id || box._id,
          boxId: box._id,
          telemetry: {
            temperature: payload.temperature ?? 4.0,
            batteryLevel: payload.batteryLevel ?? 100,
            geoLocation: { type: 'Point', coordinates: [77.2090, 28.5659] },
            isTampered: false,
          }
        });

        if (mission) {
          mission.health = { status: 'NORMAL', score: 100, lastEvaluation: new Date(), reasons: [] };
          await mission.save();
        }
        break;
      }

      case 'telemetry_alert': {
        eventType = 'TELEMETRY_ALERT';
        entityType = 'TransportMission';
        entityId = 'TRN-2026-001';

        const mission = await TransportMission.findOne({ missionId: entityId });
        await TelemetryLog.create({
          missionId: mission?._id || box._id,
          boxId: box._id,
          telemetry: {
            temperature: payload.temperature ?? 9.5,
            batteryLevel: payload.batteryLevel ?? 50,
            geoLocation: { type: 'Point', coordinates: [77.2090, 28.5659] },
            isTampered: payload.isTampered ?? true,
          }
        });

        if (mission) {
          mission.health = {
            status: 'CRITICAL',
            score: 40,
            lastEvaluation: new Date(),
            reasons: ['Temperature high: 9.5°C', 'Box tamper detected!']
          };
          await mission.save();
        }
        break;
      }

      case 'transport_arrived': {
        eventType = 'transport.arrived';
        entityType = 'TransportMission';
        entityId = 'TRN-2026-001';

        const mission = await TransportMission.findOneAndUpdate(
          { missionId: entityId },
          {
            status: 'ARRIVED',
            actualArrivalTime: new Date(),
            $push: {
              chainOfCustody: {
                timestamp: new Date(),
                actorId: admin._id,
                action: 'ARRIVED',
                location: { type: 'Point', coordinates: [77.5946, 12.9447] }
              }
            }
          },
          { new: true }
        );

        resultData = mission;
        break;
      }

      case 'transport_completed': {
        eventType = 'transport.completed';
        entityType = 'TransportMission';
        entityId = 'TRN-2026-001';

        const mission = await TransportMission.findOneAndUpdate(
          { missionId: entityId },
          { status: 'COMPLETED' },
          { new: true }
        );

        await Organ.findOneAndUpdate(
          { organId: 'ORG-2026-SIM' },
          { status: 'TRANSPLANTED', 'logistics.transportStatus': 'DELIVERED' }
        );

        resultData = mission;
        break;
      }

      default:
        return res.status(400).json({ success: false, message: `Unknown stepId: ${stepId}` });
    }

    // Append to Blockchain Ledger
    const block = await adapter.append(
      eventType,
      entityType,
      entityId,
      { stepId, timestamp: new Date().toISOString(), payload, data: resultData }
    );

    res.status(201).json({
      success: true,
      stepId,
      eventType,
      entityType,
      entityId,
      blockIndex: block.blockIndex,
      hash: block.hash,
      data: resultData,
    });
  } catch (error) {
    next(error);
  }
};
