import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SimulatorProvider } from './context/SimulatorContext';
import Home from './pages/Home';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import ExecutiveOverview from './pages/ExecutiveOverview';
import MatchingQueue from './pages/MatchingQueue';
import TransportMap from './pages/TransportMap';
import BlockchainAudit from './pages/BlockchainAudit';
import SimulatorPage from './pages/SimulatorPage';
import DonorConsent from './pages/DonorConsent';
import HospitalRegistry from './pages/HospitalRegistry';
import CommitteeApproval from './pages/CommitteeApproval';
import Analytics from './pages/Analytics';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SimulatorProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview"          element={<ExecutiveOverview />} />
                <Route path="matching"          element={<MatchingQueue />}     />
                <Route path="transport"         element={<TransportMap />}      />
                <Route path="donor-consent"     element={<DonorConsent />}      />
                <Route path="hospital-registry" element={<HospitalRegistry />}  />
                <Route path="committee"         element={<CommitteeApproval />} />
                <Route path="analytics"        element={<Analytics />}         />
                <Route path="audit"             element={<BlockchainAudit />}   />
                <Route path="simulator"         element={<SimulatorPage />}     />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SimulatorProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
