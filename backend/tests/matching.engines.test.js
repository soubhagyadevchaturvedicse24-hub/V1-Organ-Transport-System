import { describe, it, expect } from 'vitest';
import { checkCompatibility } from '../src/matching/engines/compatibilityEngine.js';
import { checkEligibility } from '../src/matching/engines/eligibilityEngine.js';
import { calculateHaversineDistance } from '../src/matching/utils/distance.js';
import { scoreRecipients } from '../src/matching/engines/scoringEngine.js';
import { recommendMatches } from '../src/matching/engines/recommendationEngine.js';

describe('Compatibility Engine', () => {
  const organ = { organType: 'KIDNEY', bloodGroup: 'O+' };
  
  it('should return only recipients with matching organ type and compatible blood group', () => {
    const recipients = [
      { id: 1, requiredOrganType: 'KIDNEY', bloodGroup: 'O+' }, // match
      { id: 2, requiredOrganType: 'HEART', bloodGroup: 'O+' }, // wrong organ
      { id: 3, requiredOrganType: 'KIDNEY', bloodGroup: 'A-' }, // wrong bg
      { id: 4, requiredOrganType: 'KIDNEY', bloodGroup: 'AB+' }, // match (universal recipient)
    ];
    
    const result = checkCompatibility(organ, recipients);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual([1, 4]);
  });
});

describe('Eligibility Engine', () => {
  it('should filter out inactive recipients and hospitals', () => {
    const recipients = [
      { id: 1, status: 'ACTIVE' }, // eligible (no hospital check)
      { id: 2, status: 'INACTIVE' }, // not eligible
      { id: 3, status: 'ACTIVE', hospitalId: { status: 'ACTIVE' } }, // eligible
      { id: 4, status: 'ACTIVE', hospitalId: { status: 'SUSPENDED' } }, // not eligible
    ];
    
    const result = checkEligibility(recipients);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.id)).toEqual([1, 3]);
  });
});

describe('Distance Utility (Haversine)', () => {
  it('should calculate distance between two points correctly', () => {
    // Delhi: 28.7041° N, 77.1025° E
    // Mumbai: 19.0760° N, 72.8777° E
    const dist = calculateHaversineDistance(77.1025, 28.7041, 72.8777, 19.0760);
    // approx 1148 km
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });
});

describe('Scoring Engine', () => {
  it('should assign correct scores based on weights', () => {
    const organ = {
      // Mock coordinates
      donorId: { hospitalId: { geoLocation: { coordinates: [77, 28] } } }
    };
    
    const recipients = [
      { 
        id: 1, 
        urgencyLevel: 'EMERGENCY', // 50 * 1 = 50
        waitlistDate: new Date(Date.now() - 1000 * 24 * 60 * 60 * 1000).toISOString(), // ~33 months = 30 max
        age: 35, // 0
        geoLocation: { coordinates: [77, 28] } // dist 0 = max dist score (10)
        // Total expected = 50 + 30 + 0 + 10 = 90
      },
      { 
        id: 2, 
        urgencyLevel: 'ROUTINE', // 50 * 0.2 = 10
        waitlistDate: Date.now(), // 0
        age: 10, // 10 pediatric
        geoLocation: { coordinates: [72, 19] } // far dist = 0 points (or close to 0)
        // Total expected = 10 + 0 + 10 + ~0 = 20
      }
    ];

    const result = scoreRecipients(organ, recipients);
    expect(result).toHaveLength(2);
    expect(result[0].score).toBeCloseTo(90, 0); // ~90
    expect(result[1].score).toBeLessThan(30); 
  });
});

describe('Recommendation Engine', () => {
  it('should sort by score and apply limits', () => {
    const scored = [
      { score: 50 },
      { score: 90 },
      { score: 10 },
      { score: 70 }
    ];
    
    const result = recommendMatches(scored, 2);
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(90);
    expect(result[1].score).toBe(70);
  });
});
