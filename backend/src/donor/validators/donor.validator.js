import { z } from 'zod';

// Standardized Medical Enums
const BloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DonorTypes = ['LIVING', 'DECEASED'];
const Genders = ['MALE', 'FEMALE', 'OTHER'];
const ConsentTypes = ['LIVING_DONOR', 'FAMILY_AUTHORIZATION'];

export const createDonorSchema = z.object({
  hospitalId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Hospital ID'),
  donorType: z.enum(DonorTypes),
  bloodGroup: z.enum(BloodGroups),
  age: z.number().int().min(0).max(120),
  gender: z.enum(Genders),
  medicalSummary: z.string().min(5),
  
  consent: z
    .object({
      consentType: z.enum(ConsentTypes).optional(),
      witnessName: z.string().optional(),
      witnessRelationship: z.string().optional(),
    })
    .optional(),
});

export const updateDonorSchema = createDonorSchema.partial();

export const rejectDonorSchema = z.object({
  rejectionReason: z.string().min(5, 'Rejection reason must be at least 5 characters'),
});

export const listDonorsSchema = z.object({
  status: z
    .enum([
      'DRAFT',
      'PENDING_MEDICAL_REVIEW',
      'MEDICALLY_ELIGIBLE',
      'CONSENT_VERIFIED',
      'AVAILABLE',
      'COMPLETED',
      'REJECTED',
      'ARCHIVED',
      'WITHDRAWN',
    ])
    .optional(),
  hospitalId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  bloodGroup: z.enum(BloodGroups).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
