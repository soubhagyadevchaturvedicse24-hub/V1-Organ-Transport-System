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
