import mongoose from 'mongoose';

const matchRecommendationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipient',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    breakdown: {
      urgency: { type: Number, default: 0 },
      waitingTime: { type: Number, default: 0 },
      distance: { type: Number, default: 0 },
      pediatric: { type: Number, default: 0 },
    },
    explanation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING_RESPONSE', 'ACCEPTED', 'DECLINED'],
      default: 'PENDING_RESPONSE',
    },
  },
  { _id: true }
);

const matchSchema = new mongoose.Schema(
  {
    matchId: {
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
    status: {
      type: String,
      enum: [
        'MATCHING_STARTED',
        'COMPATIBILITY_CHECK',
        'SCORING',
        'RANKED',
        'RECOMMENDED',
        'ACCEPTED',
        'CANCELLED',
      ],
      default: 'MATCHING_STARTED',
    },
    recommendedRecipients: {
      type: [matchRecommendationSchema],
      default: [],
    },
    acceptedRecipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recipient',
      default: null,
    },
    createdBy: {
      type: String, // system or user ID
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Match = mongoose.model('Match', matchSchema);
export default Match;
