import mongoose from 'mongoose';

/**
 * Minimal Recipient Read Model
 * Only includes fields required for the Matching Engine.
 */
const recipientSchema = new mongoose.Schema(
  {
    recipientId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    bloodGroup: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    },
    requiredOrganType: {
      type: String,
      required: true,
      enum: ['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE'],
    },
    age: {
      type: Number,
      required: true,
      min: 0,
    },
    urgencyLevel: {
      type: String,
      required: true,
      enum: ['ROUTINE', 'URGENT', 'EMERGENCY'],
      default: 'ROUTINE',
    },
    waitlistDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE', 'TRANSPLANTED', 'DECEASED'],
      default: 'ACTIVE',
    },
    geoLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true, // Required for distance calculation
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for geo queries
recipientSchema.index({ geoLocation: '2dsphere' });
recipientSchema.index({ status: 1, requiredOrganType: 1 });

const Recipient = mongoose.model('Recipient', recipientSchema);
export default Recipient;
