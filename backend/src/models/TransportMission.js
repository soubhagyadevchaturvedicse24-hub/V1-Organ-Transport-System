import mongoose from 'mongoose';

const chainOfCustodyEventSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
      },
    },
  },
  { _id: false }
);

const transportMissionSchema = new mongoose.Schema(
  {
    missionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    organId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organ',
      required: true,
    },
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Match',
      required: true,
    },
    boxId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportBox',
      required: true,
    },
    courierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    originHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    destinationHospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    estimatedArrivalTime: {
      type: Date,
    },
    actualDepartureTime: {
      type: Date,
    },
    actualArrivalTime: {
      type: Date,
    },
    chainOfCustody: {
      type: [chainOfCustodyEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

transportMissionSchema.index({ status: 1 });
transportMissionSchema.index({ 'chainOfCustody.location': '2dsphere' });

const TransportMission = mongoose.model('TransportMission', transportMissionSchema);
export default TransportMission;
