import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react';
import { useAuth } from './hooks/useAuth';
import { useUserStore } from './stores/userStore';
import LoadingSpinner from './components/LoadingSpinner';
import UserInitializer from './components/UserInitializer';
import LandingPage from './pages/LandingPage';
import StatusPage from './pages/StatusPage';
import ManualLoginPage from './pages/ManualLoginPage';
import TiltaksoversiktGenerelle from './pages/TiltaksoversiktGenerelle';
import TiltaksoversiktProsjekt from './pages/TiltaksoversiktProsjekt';
import Brukeradministrasjon from './pages/Brukeradministrasjon';
import RowNew from './components/RowNew';
import RowEdit from './components/RowEdit';
import Prosjektadministrasjon from './pages/Prosjektadministrasjon';
import MainLayout from './components/MainLayout';

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

export default function AppRouter() {
  const { user } = useUserStore();
  
  // Check if user is authenticated via manual login
  const isManuallyAuthenticated = user && user.isManualLogin;

  if (isManuallyAuthenticated) {
    // If manually authenticated, show authenticated app directly with user initialization
    return (
      <UserInitializer>
        <AuthenticatedApp />
      </UserInitializer>
    );
  }

  // Otherwise use MSAL templates for SSO authentication
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
