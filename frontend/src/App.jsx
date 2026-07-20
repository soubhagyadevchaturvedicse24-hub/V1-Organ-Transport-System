import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ExecutiveOverview from './pages/ExecutiveOverview';
import MatchingQueue from './pages/MatchingQueue';
import TransportMap from './pages/TransportMap';
import BlockchainAudit from './pages/BlockchainAudit';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<ExecutiveOverview />} />
          <Route path="matching" element={<MatchingQueue />} />
          <Route path="transport" element={<TransportMap />} />
          <Route path="audit" element={<BlockchainAudit />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
