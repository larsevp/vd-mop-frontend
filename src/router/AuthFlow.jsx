import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui";
import StatusPage from "@/pages/auth/StatusPage";
import AuthenticatedRoutes from "./AuthenticatedRoutes";

function AuthenticatedApp() {
  const { syncStatus, syncError } = useAuth();

  // DEBUG: Log current status
  //console.log('AuthenticatedApp - syncStatus:', syncStatus, 'syncError:', syncError);

  // Show loading spinner during authentication sync
  if (syncStatus === "syncing") {
    //console.log('Showing LoadingSpinner due to syncing status');
    return <LoadingSpinner />;
  }

  // Handle Safari-specific authentication issues more gracefully
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

  // Show main app if authentication succeeds (or even if there are errors - for debugging)
  //  console.log('Showing protected routes due to success status');
  return <AuthenticatedRoutes />;
}

function ManualAuthenticatedApp() {
  //console.log('ManualAuthenticatedApp - Manual user authenticated, skipping MSAL sync');
  return <AuthenticatedRoutes />;
}

export { AuthenticatedApp, ManualAuthenticatedApp };
