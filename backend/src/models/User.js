import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 12,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: [
        'PLATFORM_ADMIN',
        'NOTTO_OFFICER',
        'ROTTO_SOTTO_OFFICER',
        'HOSPITAL_COORDINATOR',
        'TRANSPLANT_SURGEON',
        'TRANSPORT_COORDINATOR',
        'COURIER',
        'AUDITOR',
      ],
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING_APPROVAL', 'SUSPENDED', 'LOCKED', 'DISABLED'],
      default: 'PENDING_APPROVAL',
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    refreshTokenHash: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
