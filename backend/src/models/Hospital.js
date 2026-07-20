import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      enum: ['REGISTRATION_CERT', 'LICENSE', 'NABH_CERT', 'COORDINATOR_ID', 'OTHER'],
    },
    url: {
      type: String,
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    hospitalCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    licenseNumber: {
      type: String,
      trim: true,
      default: null,
    },
    nabh: {
      type: Boolean,
      default: false,
    },
    hospitalType: {
      type: String,
      required: true,
      enum: ['GOVERNMENT', 'PRIVATE', 'TRUST', 'AUTONOMOUS'],
    },
    transplantCapabilities: {
      type: [String],
      enum: ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE'],
      default: [],
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: {
        type: String,
        required: true,
        match: [/^\d{6}$/, 'Pincode must be a 6-digit number'],
      },
      country: { type: String, default: 'India' },
    },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },
    contact: {
      phone: {
        type: String,
        required: true,
        match: [/^\d{10}$/, 'Phone must be a 10-digit number'],
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
      },
      website: { type: String, default: null },
    },
    documents: {
      type: [documentSchema],
      default: [],
    },
    status: {
      type: String,
      required: true,
      enum: [
        'DRAFT',
        'PENDING_VERIFICATION',
        'UNDER_REVIEW',
        'APPROVED',
        'ACTIVE',
        'SUSPENDED',
        'REJECTED',
        'DEACTIVATED',
      ],
      default: 'DRAFT',
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    // Identity links — authentication data stays in User
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true, // Enables __v version key for optimistic locking
  }
);

// Index for geo queries (future map feature)
hospitalSchema.index({ geoLocation: '2dsphere' });

const Hospital = mongoose.model('Hospital', hospitalSchema);
export default Hospital;
