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
import AuthRedirectPage from './pages/AuthRedirectPage';
import TiltaksoversiktGenerelle from './pages/TiltaksoversiktGenerelle';
import TiltaksoversiktProsjekt from './pages/TiltaksoversiktProsjekt';
import Brukeradministrasjon from './pages/models/Brukeradministrasjon';
import { RowNew, RowEdit } from './components/tableComponents';
import Prosjektadministrasjon from './pages/models/Prosjektadministrasjon';
import MainLayout from './components/layout/MainLayout';
import ProjectLanding from './pages/ProjectLanding';
import Enhetsadministrasjon from './pages/models/Enhetsadministrasjon';

function AuthenticatedApp() {
  const { syncStatus, syncError } = useAuth();

  // DEBUG: Log current status
  //console.log('AuthenticatedApp - syncStatus:', syncStatus, 'syncError:', syncError);

  // Show loading spinner during authentication sync
  if (syncStatus === 'syncing') {
    //console.log('Showing LoadingSpinner due to syncing status');
    return <LoadingSpinner />;
  }

  // Handle Safari-specific authentication issues more gracefully
  if (syncStatus === 'error') {
    //console.log('Showing StatusPage due to error status:', syncError);
    
    // For Safari-specific authentication errors, show login page instead of error page
    const isSafariAuthIssue = syncError && syncError.includes('[Safari/iOS]') && syncError.includes('Authentication required');
    
    if (isSafariAuthIssue) {
      //console.log('Safari authentication issue detected - showing login page');
      return <StatusPage type="login" error={syncError} showLoginButton={true} />;
    }
    
    return <StatusPage type="sync-error" error={syncError} showRefreshButton={true} showLogoutButton={true} />;
  }

  // Show main app if authentication succeeds (or even if there are errors - for debugging)
//  console.log('Showing protected routes due to success status');
  return <ProtectedRoutes />;
}

function ManualAuthenticatedApp() {
  //console.log('ManualAuthenticatedApp - Manual user authenticated, skipping MSAL sync');
  return <ProtectedRoutes />;
}

function ProtectedRoutes() {
  return (
    <Routes>
      {/* Protected routes with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tiltak" element={<div className="pb-20 max-w-screen-xl mx-auto"><TiltaksoversiktGenerelle /></div>} />
        <Route path="/tiltak-prosjekt" element={<div className="pb-20 max-w-screen-xl mx-auto"><TiltaksoversiktProsjekt /></div>} />
        <Route path="/admin" element={<Brukeradministrasjon />} />
        <Route path="/project-landing" element={<ProjectLanding />} />
        <Route path="/admin/ny" element={<RowNew />} />
        <Route path="/admin/:id/rediger" element={<RowEdit />} />
        <Route path="/prosjekter" element={<Prosjektadministrasjon />} />
        <Route path="/prosjekter/ny" element={<RowNew />} />
        <Route path="/prosjekter/:id/rediger" element={<RowEdit />} />
        <Route path="/enheter" element={<Enhetsadministrasjon />} />
        <Route path="/enheter/ny" element={<RowNew />} />
        <Route path="/enheter/:id/rediger" element={<RowEdit />} />
        {/* Redirect any other route (including /login) to home when authenticated */}
        <Route path="*" element={<LandingPage />} />
      </Route>
    </Routes>
  );
}

function UnauthenticatedApp() {
  return (
    <Routes>
      {/* Public routes - using StatusPage for consistent auth UI */}
      <Route path="/login" element={<StatusPage type="login" showLoginButton={true} />} />
      <Route path="/auth-redirect" element={<AuthRedirectPage />} />
      <Route path="/manualLogin" element={<ManualLoginPage />} />
      {/* Redirect any other route to login */}
      <Route path="*" element={<StatusPage type="login" showLoginButton={true} />} />
    </Routes>
  );
}

function AppRouterInner() {
  const { user } = useUserStore();
  
  //console.log('[AppRouter] Current user state:', user);
  
  const isManuallyAuthenticated = user && user.isManualLogin;
  //console.log('[AppRouter] Is manually authenticated:', isManuallyAuthenticated);
  
  if (isManuallyAuthenticated) {
    //console.log('[AppRouter] Showing manual authenticated app - bypassing MSAL');
    return (
      <UserInitializer>
        <ManualAuthenticatedApp />
      </UserInitializer>
    );
  }
  
  //console.log('[AppRouter] Showing MSAL-based authentication flow');
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
