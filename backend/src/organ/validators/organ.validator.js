import { z } from 'zod';
import { ORGAN_DEFAULTS } from '../utils/organDefaults.js';

const OrganTypes = Object.keys(ORGAN_DEFAULTS);
const ViabilityStatuses = ['PENDING_ASSESSMENT', 'VIABLE', 'MARGINAL', 'NON_VIABLE'];
const PreservationMethods = ['STATIC_COLD_STORAGE', 'MACHINE_PERFUSION', 'NONE'];

export const registerOrganSchema = z.object({
  donorId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Donor ID'),
  organType: z.enum(OrganTypes),
});

export const updateAssessmentSchema = z.object({
  viabilityStatus: z.enum(ViabilityStatuses).optional(),
  preservationMethod: z.enum(PreservationMethods).optional(),
  qualityAssessment: z.string().min(5).optional(),
});

export const allocateOrganSchema = z.object({
  allocatedToHospital: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Hospital ID'),
});

export const dispatchOrganSchema = z.object({
  transportBoxId: z.string().min(3),
});

export const discardOrganSchema = z.object({
  discardReason: z.string().min(5, 'Discard reason must be at least 5 characters'),
});

export const listOrgansSchema = z.object({
  status: z
    .enum([
      'RECOVERED',
      'IN_ASSESSMENT',
      'AWAITING_ALLOCATION',
      'ALLOCATED',
      'IN_TRANSIT',
      'TRANSPLANTED',
      'DISCARDED',
    ])
    .optional(),
  organType: z.enum(OrganTypes).optional(),
  allocationStatus: z.enum(['UNALLOCATED', 'RESERVED', 'ALLOCATED']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});
