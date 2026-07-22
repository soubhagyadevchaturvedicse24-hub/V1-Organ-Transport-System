import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SimulatorProvider } from './context/SimulatorContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

/* ── Lazy-loaded pages for code splitting ── */
const Home             = lazy(() => import('./pages/Home'));
const Login            = lazy(() => import('./pages/Login'));
const DashboardLayout  = lazy(() => import('./layouts/DashboardLayout'));
const ExecutiveOverview = lazy(() => import('./pages/ExecutiveOverview'));
const MatchingQueue    = lazy(() => import('./pages/MatchingQueue'));
const TransportMap     = lazy(() => import('./pages/TransportMap'));
const BlockchainAudit  = lazy(() => import('./pages/BlockchainAudit'));
const SimulatorPage    = lazy(() => import('./pages/SimulatorPage'));
const DonorConsent     = lazy(() => import('./pages/DonorConsent'));
const HospitalRegistry = lazy(() => import('./pages/HospitalRegistry'));
const CommitteeApproval = lazy(() => import('./pages/CommitteeApproval'));
const Analytics        = lazy(() => import('./pages/Analytics'));
const DataEntryHub     = lazy(() => import('./pages/DataEntryHub'));

/* ── Skeleton fallback while chunk loads ── */
const PageLoader = () => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    gap: '16px',
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Inter, sans-serif',
    fontSize: '0.9rem'
  }}>
    <div style={{
      width: '36px', height: '36px',
      border: '3px solid rgba(255,255,255,0.08)',
      borderTop: '3px solid #22d3a0',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite'
    }} />
    Loading page…
  </div>
);

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SimulatorProvider>
          <Router>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><ExecutiveOverview /></Suspense></ErrorBoundary>
                    } />
                    <Route path="matching" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><MatchingQueue /></Suspense></ErrorBoundary>
                    } />
                    <Route path="transport" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><TransportMap /></Suspense></ErrorBoundary>
                    } />
                    <Route path="donor-consent" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><DonorConsent /></Suspense></ErrorBoundary>
                    } />
                    <Route path="hospital-registry" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><HospitalRegistry /></Suspense></ErrorBoundary>
                    } />
                    <Route path="committee" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><CommitteeApproval /></Suspense></ErrorBoundary>
                    } />
                    <Route path="analytics" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><Analytics /></Suspense></ErrorBoundary>
                    } />
                    <Route path="data-entry" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><DataEntryHub /></Suspense></ErrorBoundary>
                    } />
                    <Route path="audit" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><BlockchainAudit /></Suspense></ErrorBoundary>
                    } />
                    <Route path="simulator" element={
                      <ErrorBoundary><Suspense fallback={<PageLoader />}><SimulatorPage /></Suspense></ErrorBoundary>
                    } />
                  </Route>
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </Router>
        </SimulatorProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
