import React from 'react';
import AppRouter from './AppRouter';
import { MsalProvider } from '@azure/msal-react';

export default function App({ msalInstance }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AppRouter />
    </MsalProvider>
  );
}