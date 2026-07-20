import mongoose from 'mongoose';
import { ORGAN_DEFAULTS } from '../organ/utils/organDefaults.js';

const organSchema = new mongoose.Schema(
  {
    // --- 1. Organ Identity ---
    organId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
    },
    organType: {
      type: String,
      required: true,
      enum: Object.keys(ORGAN_DEFAULTS),
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },

    // --- 2. Medical Assessment ---
    medicalAssessment: {
      viabilityStatus: {
        type: String,
        enum: ['PENDING_ASSESSMENT', 'VIABLE', 'MARGINAL', 'NON_VIABLE'],
        default: 'PENDING_ASSESSMENT',
      },
      preservationMethod: {
        type: String,
        enum: ['STATIC_COLD_STORAGE', 'MACHINE_PERFUSION', 'NONE'],
        default: 'NONE',
      },
      coldIschemiaTimeLimit: {
        type: Number, // Stored in hours based on Organ Defaults
        required: true,
      },
      qualityAssessment: {
        type: String,
        default: null,
      },
      assessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
    },

    // --- 3. Allocation ---
    allocation: {
      allocationStatus: {
        type: String,
        enum: ['UNALLOCATED', 'RESERVED', 'ALLOCATED'],
        default: 'UNALLOCATED',
      },
      allocatedToHospital: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hospital',
        default: null,
      },
    },

    // --- 4. Logistics ---
    logistics: {
      transportBoxId: {
        type: String, // String ref to future IoT box logic
        default: null,
      },
      transportStatus: {
        type: String,
        enum: ['NOT_DISPATCHED', 'IN_TRANSIT', 'DELIVERED'],
        default: 'NOT_DISPATCHED',
      },
    },

    // --- Core Workflow & Audit ---
    status: {
      type: String,
      required: true,
      enum: [
        'RECOVERED',
        'IN_ASSESSMENT',
        'AWAITING_ALLOCATION',
        'ALLOCATED',
        'IN_TRANSIT',
        'TRANSPLANTED',
        'DISCARDED',
      ],
      default: 'RECOVERED',
    },
    discardReason: {
      type: String,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  }
);

const Organ = mongoose.model('Organ', organSchema);
export default Organ;
