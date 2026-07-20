import mongoose from 'mongoose';

const ledgerBlockSchema = new mongoose.Schema(
  {
    blockIndex: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    previousHash: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
      unique: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
      required: true,
      index: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Prevent modifications (Blockchain immutability in MongoDB)
ledgerBlockSchema.pre('updateOne', function (next) {
  next(new Error('LedgerBlock is immutable and cannot be updated'));
});
ledgerBlockSchema.pre('findOneAndUpdate', function (next) {
  next(new Error('LedgerBlock is immutable and cannot be updated'));
});
ledgerBlockSchema.pre('updateMany', function (next) {
  next(new Error('LedgerBlock is immutable and cannot be updated'));
});
ledgerBlockSchema.pre('remove', function (next) {
  next(new Error('LedgerBlock is immutable and cannot be deleted'));
});
ledgerBlockSchema.pre('deleteOne', function (next) {
  next(new Error('LedgerBlock is immutable and cannot be deleted'));
});
ledgerBlockSchema.pre('deleteMany', function (next) {
  next(new Error('LedgerBlock is immutable and cannot be deleted'));
});

const LedgerBlock = mongoose.model('LedgerBlock', ledgerBlockSchema);
export default LedgerBlock;
