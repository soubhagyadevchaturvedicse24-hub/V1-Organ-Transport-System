import { z } from 'zod';

export const createHospitalSchema = z.object({
  name: z.string().min(3).max(200),
  registrationNumber: z.string().min(1, 'Registration number is required'),
  licenseNumber: z.string().optional(),
  nabh: z.boolean().optional().default(false),
  hospitalType: z.enum(['GOVERNMENT', 'PRIVATE', 'TRUST', 'AUTONOMOUS']),
  transplantCapabilities: z
    .array(z.enum(['KIDNEY', 'LIVER', 'HEART', 'LUNG', 'CORNEA', 'PANCREAS', 'INTESTINE']))
    .optional()
    .default([]),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    country: z.string().optional().default('India'),
  }),
  geoLocation: z
    .object({
      coordinates: z
        .tuple([
          z.number().min(-180).max(180), // longitude
          z.number().min(-90).max(90),   // latitude
        ])
        .optional(),
    })
    .optional(),
  contact: z.object({
    phone: z.string().regex(/^\d{10}$/, 'Phone must be 10 digits'),
    email: z.string().email('Invalid email format'),
    website: z.string().url().optional().nullable(),
  }),
});

export const updateHospitalSchema = createHospitalSchema.partial();

export const rejectHospitalSchema = z.object({
  rejectionReason: z.string().min(10, 'Rejection reason must be at least 10 characters'),
});

export const listHospitalsSchema = z.object({
  status: z
    .enum([
      'DRAFT', 'PENDING_VERIFICATION', 'UNDER_REVIEW',
      'APPROVED', 'ACTIVE', 'SUSPENDED', 'REJECTED', 'DEACTIVATED',
    ])
    .optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
