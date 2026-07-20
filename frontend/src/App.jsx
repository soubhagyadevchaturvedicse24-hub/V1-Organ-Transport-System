import React, { useEffect, useState } from 'react';
import { checkHealth } from './services/health.service.js';
import './App.css';

function App() {
  const [status, setStatus] = useState('Checking...');
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await checkHealth();
        if (data.status === 'UP') {
          setStatus('🟢 Online');
        } else {
          setStatus('🔴 Offline');
        }
      } catch (error) {
        setStatus('🔴 Offline');
      }
    };
    
    fetchStatus();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Organ Transport Platform</h1>
        <h2>Backend Status</h2>
        <p>{status}</p>
      </header>
    </div>
  );
}

export default App;
