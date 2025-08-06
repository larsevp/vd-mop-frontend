import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './AppRouter';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { useAuth } from './hooks/useAuth';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorPage from './pages/ErrorPage';
import { loginRequest } from './msalConfig';

function UnauthenticatedRedirect() {
  const { instance } = useMsal();
  const location = useLocation();

  useEffect(() => {
    // Store the intended destination and redirect directly to Microsoft SSO
    const returnUrl = location.pathname + location.search;
    
    instance.loginRedirect({
      ...loginRequest,
      state: JSON.stringify({ returnUrl })
    }).catch(error => {
      console.error('Login redirect failed:', error);
      // On error, redirect to login page for error handling
      window.location.href = '/login';
    });
  }, [instance, location]);

  return <LoadingSpinner />;
}

function AuthenticatedApp() {
  const { syncStatus, syncError } = useAuth();

  // Show loading spinner during authentication sync
  if (syncStatus === 'syncing') {
    return <LoadingSpinner />;
  }

  // Show error page if authentication fails
  if (syncStatus === 'error') {
    return <ErrorPage error={syncError} />;
  }

  // Show main app if authentication succeeds
  return <AppRouter />;
}

export default function App({ msalInstance }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthenticatedTemplate>
        <AuthenticatedApp />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <UnauthenticatedRedirect />
      </UnauthenticatedTemplate>
    </MsalProvider>
  );
}