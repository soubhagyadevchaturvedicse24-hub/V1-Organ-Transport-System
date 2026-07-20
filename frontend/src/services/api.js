// Simplified API layer
// In a real app, this would handle auth tokens, retries, etc.

const BASE_URL = 'http://localhost:5000/api/v1';
let token = null;

export const setToken = (newToken) => {
  token = newToken;
};

const fetchApi = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${response.status}`);
  }
  
  // Return empty array for 204 or empty responses instead of throwing JSON error
  const text = await response.text();
  return text ? JSON.parse(text) : [];
};

// --- Endpoints ---

export const getHospitals = () => fetchApi('/hospitals');
export const getDonors = () => fetchApi('/donors');
export const getOrgans = () => fetchApi('/organs');
export const getMissions = () => fetchApi('/transport/missions');
export const verifyLedger = () => fetchApi('/audit/verify');
export const getEntityHistory = (type, id) => fetchApi(`/audit/entity/${type}/${id}`);

export const getMatches = () => {
  // In a real app we'd fetch actual pending matches from an endpoint.
  // We'll mock it here to ensure the UI can be built and demonstrated if backend is not seeded.
  return Promise.resolve([
    {
      _id: 'MAT-1',
      organId: 'ORG-KID-001',
      recipientId: 'REC-2026-001',
      score: 95,
      status: 'pending',
      compatibility: {
        bloodTypeMatch: true,
        hlaMatchCount: 5,
        sizeMatch: true,
      },
      reasoning: [
        'Perfect ABO compatibility.',
        '5/6 HLA match indicates very low rejection risk.',
        'Recipient urgency is high (Score: 85).'
      ]
    },
    {
      _id: 'MAT-2',
      organId: 'ORG-LIV-002',
      recipientId: 'REC-2026-005',
      score: 72,
      status: 'pending',
      compatibility: {
        bloodTypeMatch: true,
        hlaMatchCount: 3,
        sizeMatch: false,
      },
      reasoning: [
        'ABO compatible.',
        '3/6 HLA match is acceptable but not optimal.',
        'Slight size mismatch (organ is larger than ideal for recipient).'
      ]
    }
  ]);
};

export const updateMatchStatus = (matchId, action) => {
  return fetchApi(`/matching/${matchId}/${action}`, { method: 'POST' });
};

export const getDashboardKPIs = async () => {
  try {
    // We run these in parallel
    const [hospitals, donors, organs, missions, ledger] = await Promise.all([
      getHospitals().catch(() => []),
      getDonors().catch(() => []),
      getOrgans().catch(() => []),
      getMissions().catch(() => []),
      verifyLedger().catch(() => ({ totalBlocks: 0 }))
    ]);

    return {
      hospitalsCount: hospitals.length || 0,
      donorsCount: donors.length || 0,
      organsCount: organs.length || 0,
      missionsCount: missions.length || 0,
      blocksCount: ledger.totalBlocks || 0,
    };
  } catch (error) {
    console.error('Failed to fetch KPIs:', error);
    throw error;
  }
};

export const getLiveMission = () => {
  // Mock data for the live transport map to demonstrate the UI
  // In a real app, this would be populated from the backend and updated via WebSocket
  return Promise.resolve({
    id: 'TRN-2026-001',
    boxId: 'BOX-101',
    origin: { name: 'AIIMS New Delhi', lat: 28.5659, lng: 77.2090 },
    destination: { name: 'Tata Memorial Mumbai', lat: 19.0069, lng: 72.8427 },
    currentLocation: { lat: 23.0, lng: 75.0 }, // Somewhere in between
    telemetry: {
      temperature: 4.2,
      tempTrend: 'stable',
      battery: 88,
      batteryTrend: 'decreasing',
      eta: '2h 15m'
    },
    health: {
      status: 'NORMAL',
      score: 100,
      reasons: []
    }
  });
};
