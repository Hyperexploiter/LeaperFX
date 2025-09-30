import React from 'react';
import ReactDOM from 'react-dom/client';
import CurrencyExchangeWebsite from './website_exchange_store';

// Apply any global styles if needed
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CurrencyExchangeWebsite />
  </React.StrictMode>,
);