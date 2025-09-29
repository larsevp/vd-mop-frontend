/**
 * Authentication Redirect Handler
 *
 * This component handles the redirect response from Azure AD after authentication.
 * It processes the authentication result and navigates the user to their intended destination.
 *
 * This page should only be accessed as a redirect from Azure AD.
 */

import React, { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/ui";

export default function AuthRedirectPage() {
  const { instance } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirectResponse = async () => {
      try {
        // Handle the redirect response from Azure AD
        const response = await instance.handleRedirectPromise();

        if (response) {
          // Successful authentication
          const username = response.account?.username || response.account?.name || "unknown";

          // Extract return URL from the state parameter
          let returnUrl = "/"; // Default to home page

          if (response.state) {
            try {
              const state = JSON.parse(response.state);
              returnUrl = state.returnUrl || "/";
            } catch (error) {
              console.warn("[AuthRedirect] Could not parse state parameter:", error);
            }
          }

          navigate(returnUrl, { replace: true });
        } else {
          // No response means no authentication occurred

          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("[AuthRedirect] Error processing redirect:", error);

        // Handle specific MSAL errors
        if (error.errorCode === "user_cancelled") {
          navigate("/login?error=cancelled", { replace: true });
        } else if (error.errorCode === "access_denied") {
          navigate("/login?error=access_denied", { replace: true });
        } else {
          navigate("/login?error=auth_failed", { replace: true });
        }
      }
    };

    // Process the redirect immediately when component mounts
    handleRedirectResponse();
  }, [instance, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="text-center">
        <LoadingSpinner />
        <p className="text-neutral-600 mt-4">Completing authentication...</p>
        <p className="text-neutral-400 text-sm mt-2">Please wait while we process your login</p>
      </div>
    </div>
  );
}
