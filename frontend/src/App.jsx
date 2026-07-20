import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ExecutiveOverview from './pages/ExecutiveOverview';
import MatchingQueue from './pages/MatchingQueue';
import './App.css';

// Placeholder Pages
const TransportMap = () => <div className="page-container"><h1 className="gradient-text">Live Transport</h1></div>;
const BlockchainTimeline = () => <div className="page-container"><h1 className="gradient-text">Blockchain Audit</h1></div>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<ExecutiveOverview />} />
          <Route path="matching" element={<MatchingQueue />} />
          <Route path="transport" element={<TransportMap />} />
          <Route path="audit" element={<BlockchainTimeline />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
