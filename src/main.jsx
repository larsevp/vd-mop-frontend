import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from './msalConfig';
import { registerMsalInstance, setMsalHydrated } from './utils/msalUtils';
import App from './App';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';

// Create single PCA (no manual handleRedirectPromise here – msal-react will handle it)
const msalInstance = new PublicClientApplication(msalConfig);
registerMsalInstance(msalInstance);
setMsalHydrated();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App msalInstance={msalInstance} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);