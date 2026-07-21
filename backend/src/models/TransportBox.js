import mongoose from 'mongoose';

const transportBoxSchema = new mongoose.Schema(
  {
    boxId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deviceId: {
      type: String,
      required: true,
      unique: true, // Hardware MAC or Serial
    },
    deviceSecretHash: {
      type: String,
      required: false, // Hashed x-device-secret (for backward compatibility)
    },
    devicePublicKey: {
      type: String,
      required: false, // PEM public key for ECDSA signature validation
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'IN_TRANSIT', 'MAINTENANCE', 'DECOMMISSIONED'],
      default: 'AVAILABLE',
    },
    firmwareVersion: {
      type: String,
      default: '1.0.0',
    },
    batteryHealth: {
      type: Number, // Percentage of maximum degradation (0-100)
      default: 100,
    },
    lastHeartbeat: {
      type: Date,
      default: null,
    },
    lastKnownLocation: {
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
    lastMaintenanceDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

transportBoxSchema.index({ lastKnownLocation: '2dsphere' });

const TransportBox = mongoose.model('TransportBox', transportBoxSchema);
export default TransportBox;
