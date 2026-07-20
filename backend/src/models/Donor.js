import mongoose from 'mongoose';

const donorSchema = new mongoose.Schema(
  {
    // --- 1. Donor Identity ---
    donorId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    donorType: {
      type: String,
      required: true,
      enum: ['LIVING', 'DECEASED'],
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    age: {
      type: Number,
      required: true,
      min: 0,
      max: 120,
    },
    gender: {
      type: String,
      required: true,
      enum: ['MALE', 'FEMALE', 'OTHER'],
    },
    medicalSummary: {
      type: String,
      required: true,
      trim: true,
    },

    // --- 2. Consent ---
    consent: {
      consentType: {
        type: String,
        enum: ['LIVING_DONOR', 'FAMILY_AUTHORIZATION'],
        default: null,
      },
      status: {
        type: String,
        enum: ['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED'],
        default: 'PENDING',
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      witnessName: {
        type: String,
        default: null,
      },
      witnessRelationship: {
        type: String,
        default: null,
      },
    },

    // --- 3. Medical Eligibility ---
    medicalEligibility: {
      status: {
        type: String,
        enum: ['PENDING', 'ELIGIBLE', 'TEMPORARILY_DEFERRED', 'INELIGIBLE'],
        default: 'PENDING',
      },
      assessmentNotes: {
        type: String,
        default: null,
      },
      assessedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      assessedAt: {
        type: Date,
        default: null,
      },
    },

    // --- Core Workflow & Audit ---
    status: {
      type: String,
      required: true,
      enum: [
        'DRAFT',
        'PENDING_MEDICAL_REVIEW',
        'MEDICALLY_ELIGIBLE',
        'CONSENT_VERIFIED',
        'AVAILABLE',
        'COMPLETED',
        'REJECTED',
        'ARCHIVED',
        'WITHDRAWN',
      ],
      default: 'DRAFT',
    },
    rejectionReason: {
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

const Donor = mongoose.model('Donor', donorSchema);
export default Donor;
