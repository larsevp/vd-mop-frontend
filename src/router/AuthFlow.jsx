import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/stores/userStore";
import { LoadingSpinner } from "@/components/ui";
import StatusPage from "@/pages/auth/StatusPage";
import AuthenticatedRoutes from "./AuthenticatedRoutes";

function AuthenticatedApp() {
  const { syncStatus, syncError } = useAuth();

  // DEBUG: Log current status
  //console.log('AuthenticatedApp - syncStatus:', syncStatus);

  // Show loading spinner during MSAL authentication sync
  if (syncStatus === "syncing") {
    //console.log('Showing LoadingSpinner due to syncing status');
    return <LoadingSpinner text="Synkroniserer autentisering..." />;
  }

  // Handle MSAL authentication errors
  if (syncStatus === "error") {
    //console.log('Showing StatusPage due to error status:', syncError);

    // For Safari-specific authentication errors, show login page instead of error page
    const isSafariAuthIssue = syncError && syncError.includes("[Safari/iOS]") && syncError.includes("Authentication required");

    if (isSafariAuthIssue) {
      //console.log('Safari authentication issue detected - showing login page');
      return <StatusPage type="login" error={syncError} showLoginButton={true} />;
    }

    return <StatusPage type="sync-error" error={syncError} showRefreshButton={true} showLogoutButton={true} />;
  }

  // MSAL authentication successful - UserInitializer handles backend validation
  return <AuthenticatedRoutes />;
}

function ManualAuthenticatedApp() {
  //console.log('ManualAuthenticatedApp - Manual user authenticated, skipping MSAL sync');
  return <AuthenticatedRoutes />;
}

export { AuthenticatedApp, ManualAuthenticatedApp };
