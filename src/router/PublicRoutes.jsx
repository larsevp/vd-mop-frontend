import React from "react";
import { Routes, Route } from "react-router-dom";
import StatusPage from "@/pages/auth/StatusPage";
import AuthRedirectPage from "@/pages/auth/AuthRedirectPage";
import ManualLoginPage from "@/pages/auth/ManualLoginPage";

export default function PublicRoutes() {
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
