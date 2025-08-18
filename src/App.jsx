import React, { useEffect } from "react";
import AppRouter from "./AppRouter";
import { MsalProvider } from "@azure/msal-react";
import { startTokenMonitoring } from "./utils/tokenRefresh";

export default function App({ msalInstance }) {
  useEffect(() => {
    // Start token monitoring for manual auth users
    startTokenMonitoring();
  }, []);

  return (
    <MsalProvider instance={msalInstance}>
      <AppRouter />
    </MsalProvider>
  );
}
