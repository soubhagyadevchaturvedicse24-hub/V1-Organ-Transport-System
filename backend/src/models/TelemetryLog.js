import mongoose from 'mongoose';

const telemetryLogSchema = new mongoose.Schema(
  {
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportMission',
      required: true,
    },
    boxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportBox',
      required: true,
    },
    telemetry: {
      temperature: {
        type: Number, // Celsius
        required: true,
      },
      batteryLevel: {
        type: Number, // Percentage 0-100
        required: true,
      },
      geoLocation: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
      isTampered: {
        type: Boolean,
        default: false,
      },
    },
    arweaveTxId: {
      type: String,
      default: null,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'missionId',
      granularity: 'seconds',
    },
  }
);

// Geo index on the telemetry
telemetryLogSchema.index({ 'telemetry.geoLocation': '2dsphere' });

const TelemetryLog = mongoose.model('TelemetryLog', telemetryLogSchema);
export default TelemetryLog;
