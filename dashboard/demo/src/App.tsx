import React from 'react';
// This is the corrected default import (no curly braces)
import ExchangeDashboard from './ExchangeDashboard';
import './index.css';

function App(): React.ReactElement {
  return (
    <React.StrictMode>
      <ExchangeDashboard />
    </React.StrictMode>
  );
}

export default App;
