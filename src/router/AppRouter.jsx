import React from "react";
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useUserStore } from "@/stores/userStore";
import UserInitializer from "@/components/auth/UserInitializer";
import { AuthenticatedApp, ManualAuthenticatedApp } from "./AuthFlow";
import PublicRoutes from "./PublicRoutes";

function AppRouterInner() {
  const { user } = useUserStore();

  const isManuallyAuthenticated = user && user.isManualLogin;

  if (isManuallyAuthenticated) {
    return (
      <UserInitializer>
        <ManualAuthenticatedApp />
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
        <PublicRoutes />
      </UnauthenticatedTemplate>
    </>
  );
}

export default function AppRouter() {
  return <AppRouterInner />;
}
