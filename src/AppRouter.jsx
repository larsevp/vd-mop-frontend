import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal } from '@azure/msal-react';
import { useAuth } from './hooks/useAuth';
import { useUserStore } from './stores/userStore';
import LoadingSpinner from './components/ui/LoadingSpinner';
import UserInitializer from './components/auth/UserInitializer';
import LandingPage from './pages/LandingPage';
import StatusPage from './pages/StatusPage';
import ManualLoginPage from './pages/ManualLoginPage';
import TiltaksoversiktGenerelle from './pages/TiltaksoversiktGenerelle';
import TiltaksoversiktProsjekt from './pages/TiltaksoversiktProsjekt';
import Brukeradministrasjon from './pages/Brukeradministrasjon';
import { RowNew, RowEdit } from './components/tableComponents';
import Prosjektadministrasjon from './pages/Prosjektadministrasjon';
import MainLayout from './components/layout/MainLayout';

function AuthenticatedApp() {
  const { syncStatus, syncError, authErrorCount } = useAuth();

  // DEBUG: Log current status
  console.log('AuthenticatedApp - syncStatus:', syncStatus, 'syncError:', syncError);

  // Show loading spinner during authentication sync
  if (syncStatus === 'syncing') {
    console.log('Showing LoadingSpinner due to syncing status');
    return <LoadingSpinner />;
  }

  // Handle Safari-specific authentication issues more gracefully
  if (syncStatus === 'error') {
    console.log('Showing StatusPage due to error status:', syncError);
    
    // For Safari-specific authentication errors, show login page instead of error page
    const isSafariAuthIssue = syncError && syncError.includes('[Safari/iOS]') && syncError.includes('Authentication required');
    
    if (isSafariAuthIssue) {
      console.log('Safari authentication issue detected - showing login page');
      return <StatusPage type="login" error={syncError} showLoginButton={true} />;
    }
    
    return <StatusPage type="sync-error" error={syncError} showRefreshButton={true} showLogoutButton={true} />;
  }

  // Show main app if authentication succeeds (or even if there are errors - for debugging)
  console.log('Showing protected routes due to success status');
  return (
    <UserInitializer>
      <Routes>
        {/* Protected routes with main layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tiltak" element={<div className="pb-20 max-w-screen-xl mx-auto"><TiltaksoversiktGenerelle /></div>} />
          <Route path="/tiltak-prosjekt" element={<div className="pb-20 max-w-screen-xl mx-auto"><TiltaksoversiktProsjekt /></div>} />
          <Route path="/admin" element={<Brukeradministrasjon />} />
          <Route path="/admin/ny" element={<RowNew />} />
          <Route path="/admin/:id/rediger" element={<RowEdit />} />
          <Route path="/prosjekter" element={<Prosjektadministrasjon />} />
          <Route path="/prosjekter/ny" element={<RowNew />} />
          <Route path="/prosjekter/:id/rediger" element={<RowEdit />} />
          {/* Redirect any other route (including /login) to home when authenticated */}
          <Route path="*" element={<LandingPage />} />
        </Route>
      </Routes>
    </UserInitializer>
  );
}

function UnauthenticatedApp() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<StatusPage type="login" showLoginButton={true} />} />
      <Route path="/manualLogin" element={<ManualLoginPage />} />
      {/* Redirect any other route to login */}
      <Route path="*" element={<StatusPage type="login" showLoginButton={true} />} />
    </Routes>
  );
}

function AppRouterInner() {
  const { user } = useUserStore();
  const { inProgress, accounts } = useMsal();
  const hydrating = inProgress !== 'none' && accounts.length === 0;
  if (hydrating) return <LoadingSpinner />;
  const isManuallyAuthenticated = user && user.isManualLogin;
  if (isManuallyAuthenticated) {
    return (
      <UserInitializer>
        <AuthenticatedApp />
      </UserInitializer>
    );
  }
  return (
    <>
      <AuthenticatedTemplate>
        <UserInitializer>
          <AuthenticatedApp />
        </UserInitializer>
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <UnauthenticatedApp />
      </UnauthenticatedTemplate>
    </>
  );
}

export default function AppRouter() { return <AppRouterInner />; }
