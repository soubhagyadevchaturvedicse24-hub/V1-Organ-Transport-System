// Simplified API layer
// In a real app, this would handle auth tokens, retries, etc.

export const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api/v1';
  }
  return 'https://v1-organ-transport-system.onrender.com/api/v1';
};

export const getSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }
  return 'https://v1-organ-transport-system.onrender.com';
};

export const BASE_URL = getBaseUrl();
let token = null;

export const setToken = (newToken) => {
  token = newToken;
};

const fetchApi = async (endpoint, options = {}) => {
  const token = localStorage.getItem('neolife_token');
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
  
  const text = await response.text();
  if (!text) return [];
  const parsed = JSON.parse(text);
  return parsed.data !== undefined ? parsed.data : parsed;
};

// --- Endpoints ---

export const getHospitals = () => fetchApi('/hospitals');
export const createHospital = (data) => fetchApi('/hospitals', { method: 'POST', body: JSON.stringify(data) });

export const getDonors = () => fetchApi('/donors');
export const createDonor = (data) => fetchApi('/donors', { method: 'POST', body: JSON.stringify(data) });

export const getOrgans = () => fetchApi('/organs');
export const createOrgan = (data) => fetchApi('/organs', { method: 'POST', body: JSON.stringify(data) });

export const createRecipient = (data) => fetchApi('/recipients', { method: 'POST', body: JSON.stringify(data) });

export const getMissions = () => fetchApi('/transport/missions');
export const createMission = (data) => fetchApi('/transport/missions', { method: 'POST', body: JSON.stringify(data) });
export const verifyLedger = () => fetchApi('/audit/verify');
export const getEntityHistory = (type, id) => fetchApi(`/audit/entity/${type}/${id}`);
export const getAllBlocks = () => fetchApi('/audit/blocks');
export const verifyBlock = (blockIndex) => fetchApi(`/audit/verify-block/${blockIndex}`);

export const getMatches = () => fetchApi('/matching');

export const updateMatchStatus = (matchId, recipientId, action) => {
  return fetchApi(`/matching/${matchId}/recipients/${recipientId}/${action}`, { method: 'POST' });
};

export const getDashboardKPIs = async () => {
  try {
    const [hospitals, donors, organs, missions, ledger] = await Promise.all([
      getHospitals().catch(() => []),
      getDonors().catch(() => []),
      getOrgans().catch(() => []),
      getMissions().catch(() => []),
      verifyLedger().catch(() => ({ totalBlocks: 0 }))
    ]);

    const getCount = (data, key) => {
      if (Array.isArray(data)) return data.length;
      if (data && Array.isArray(data[key])) return data[key].length;
      return 0;
    };

    return {
      hospitalsCount: getCount(hospitals, 'hospitals'),
      donorsCount: getCount(donors, 'donors'),
      organsCount: getCount(organs, 'organs'),
      missionsCount: getCount(missions, 'missions'),
      blocksCount: ledger.totalBlocks || 0,
    };
  } catch (error) {
    console.error('Failed to fetch KPIs:', error);
    throw error;
  }
};

export const getLiveMission = async (missionId) => {
  if (missionId) {
    return fetchApi(`/transport/missions/${missionId}`);
  }
  
  const missionsResp = await getMissions().catch(() => []);
  const missions = Array.isArray(missionsResp) ? missionsResp : (missionsResp.missions || []);
  
  const activeMission = missions.find(m => m.status === 'IN_TRANSIT');
  if (activeMission) return fetchApi(`/transport/missions/${activeMission.missionId || activeMission._id}`);
  
  return missions[0] ? fetchApi(`/transport/missions/${missions[0].missionId || missions[0]._id}`) : null;
};
