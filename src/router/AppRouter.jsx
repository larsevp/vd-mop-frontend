import React from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useUserStore } from "@/stores/userStore";
import UserInitializer from "@/components/auth/UserInitializer";
import { AuthenticatedApp, ManualAuthenticatedApp } from "./AuthFlow";
import PublicRoutes from "./PublicRoutes";

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
        <PublicRoutes />
      </UnauthenticatedTemplate>
    </>
  );
}

export default function AppRouter() {
  return <AppRouterInner />;
}
