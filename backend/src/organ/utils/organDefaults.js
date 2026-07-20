/**
 * Default configurations for various organ types.
 * Cold Ischemia limits are defined in hours.
 */
export const ORGAN_DEFAULTS = Object.freeze({
  KIDNEY: {
    code: 'KID',
    defaultColdIschemiaTimeLimitHours: 36, // 24-36 hrs
  },
  LIVER: {
    code: 'LIV',
    defaultColdIschemiaTimeLimitHours: 12, // 8-12 hrs
  },
  HEART: {
    code: 'HRT',
    defaultColdIschemiaTimeLimitHours: 6, // 4-6 hrs
  },
  LUNGS: {
    code: 'LNG',
    defaultColdIschemiaTimeLimitHours: 8, // 6-8 hrs
  },
  PANCREAS: {
    code: 'PAN',
    defaultColdIschemiaTimeLimitHours: 18, // 12-18 hrs
  },
  CORNEA: {
    code: 'COR',
    defaultColdIschemiaTimeLimitHours: 336, // ~14 days if preserved properly
  },
});
