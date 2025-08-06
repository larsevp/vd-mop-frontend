import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AppRouter from './AppRouter';
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { useAuth } from './hooks/useAuth';
import { useUserStore } from './stores/userStore';
import LoadingSpinner from './components/LoadingSpinner';
import StatusPage from './pages/StatusPage';
import { loginRequest } from './msalConfig';

function UnauthenticatedRedirect() {
  const location = useLocation();
  const { instance } = useMsal();

  console.log('UnauthenticatedRedirect: Current location:', location.pathname);

  // DEBUG: Check MSAL state
  useEffect(() => {
    const checkMsalState = async () => {
      await instance.initialize();
      const accounts = instance.getAllAccounts();
      console.log('UnauthenticatedRedirect: MSAL accounts count:', accounts.length);
      console.log('UnauthenticatedRedirect: MSAL cache present:', !!instance.getTokenCache());
    };
    checkMsalState();
  }, [instance]);

  // Instead of auto-redirecting to Microsoft, redirect to our login page
  // This gives users choice between SSO and manual login
  useEffect(() => {
    // Only redirect if not already on a login page
    if (!location.pathname.includes('login')) {
      console.log('UnauthenticatedRedirect: Redirecting to /login from:', location.pathname);
      window.location.href = '/login';
    } else {
      console.log('UnauthenticatedRedirect: Already on login page, not redirecting');
    }
  }, [location]);

  return <LoadingSpinner />;
}

function AuthenticatedApp() {
  const { syncStatus, syncError, authErrorCount } = useAuth();

  // DEBUG: Log current status
  console.log('AuthenticatedApp - syncStatus:', syncStatus, 'syncError:', syncError);

  // Show loading spinner during authentication sync
  if (syncStatus === 'syncing') {
    console.log('Showing LoadingSpinner due to syncing status');
    return <LoadingSpinner />;
  }

  // RE-ENABLED - to see auth errors during debugging
  // Show error page if authentication fails (including runtime 401 errors)
  if (syncStatus === 'error') {
    console.log('Showing StatusPage due to error status:', syncError);
    return <StatusPage type="sync-error" error={syncError} showRefreshButton={true} showLogoutButton={true} />;
  }

  // Show main app if authentication succeeds (or even if there are errors - for debugging)
  console.log('Showing AppRouter due to success status');
  return <AppRouter />;
}

export default function App({ msalInstance }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AppRouter />
    </MsalProvider>
  );
}