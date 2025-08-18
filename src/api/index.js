/**
 * API Client Configuration
 *
 * This file sets up the Axios client with automatic authentication token handling.
 * It includes request interceptors that automatically attach MSAL tokens to API calls.
 */

import axios from "axios";
import { useUserStore } from "@/stores/userStore";
import { getMsalInstance } from "../utils/msalUtils";

// Create the main API client
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

/**
 * Request Interceptor
 * Automatically attaches authentication tokens to outgoing requests
 */
API.interceptors.request.use(async (config) => {
  const user = useUserStore.getState().user;
  const instance = getMsalInstance();

  // Handle manual login tokens (for development/testing)
  if (user && user.isManualLogin) {
    const manualToken = user.manualToken || localStorage.getItem("mt");
    if (manualToken) {
      config.headers = config.headers || {};
      config.headers["Authorization"] = `Bearer ${manualToken}`;
      if (user.id) config.headers["x-user-id"] = user.id;
      //console.log('[API] Using manual token for request');
      return config;
    }
  }

  // Handle MSAL token acquisition for authenticated users
  if (user && !user.isManualLogin && instance) {
    try {
      const accounts = instance.getAllAccounts();
      let account = null;

      // Find the correct account for this user
      if (user.id) {
        account = accounts.find((acc) => acc.localAccountId === user.id || acc.homeAccountId === user.id);
      }

      // Fall back to first account if specific account not found
      if (!account && accounts.length > 0) {
        account = accounts[0];
      }

      if (account) {
        try {
          // Attempt to acquire token silently
          const API_CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID;
          const result = await instance.acquireTokenSilent({
            scopes: [`api://${API_CLIENT_ID}/user_access`],
            account: account,
            forceRefresh: false,
          });

          config.headers = config.headers || {};
          config.headers["Authorization"] = `Bearer ${result.accessToken}`;
          /*
          console.log('[API] Token acquired successfully, expires:', new Date(result.expiresOn));
          console.log('[API] Token preview:', result.accessToken.substring(0, 50) + '...');
          console.log('[API] Token parts count:', result.accessToken.split('.').length);
          */
          // Debug: decode token to see what we're sending
          try {
            const tokenParts = result.accessToken.split(".");
            const payload = JSON.parse(atob(tokenParts[1]));
            //console.log('[API] Token payload - iss:', payload.iss, 'aud:', payload.aud, 'exp:', payload.exp);
          } catch (decodeError) {
            console.warn("[API] Could not decode token for debugging:", decodeError);
          }
        } catch (tokenError) {
          console.warn("[API] Token acquisition failed:", tokenError.errorCode);
          // Don't implement complex retry logic here - let the auth error handler manage it
          // The request will proceed without a token and the server will return 401 if needed
        }
      } else {
        console.warn("[API] No MSAL account found for token acquisition");
      }

      // Always add user ID header if available
      if (user.id) {
        config.headers = config.headers || {};
        config.headers["x-user-id"] = user.id;
      }
    } catch (error) {
      console.error("[API] MSAL token pipeline failed:", error);
    }
  }

  return config;
});

/**
 * Response Interceptor
 * Handles authentication errors and automatic token refresh for manual auth users
 * Enhanced with specific error code handling and automatic redirects
 */
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 responses with enhanced error codes
    if (error?.response?.status === 401 && !originalRequest._retry) {
      const user = useUserStore.getState().user;
      const errorData = error.response.data;
      const errorCode = errorData?.code;
      const shouldRedirectToLogin = errorData?.shouldRedirectToLogin;

      console.warn(`[API] Authentication error: ${errorCode || "UNKNOWN"} - ${errorData?.error || error.message}`);

      // Check for simple "Authentication required" response (no error code)
      const isSimpleAuthRequired = errorData?.error === "Authentication required" && !errorCode;

      // Handle specific error cases or simple auth required
      if (shouldRedirectToLogin || isSimpleAuthRequired) {
        switch (errorCode) {
          case "TOKEN_NOT_ACTIVE":
            console.warn("[API] Token timing issue detected - forcing login refresh");
            break;
          case "TOKEN_EXPIRED":
            console.warn("[API] Token expired - redirecting to login");
            break;
          case "KEY_RETRIEVAL_FAILED":
            console.warn("[API] Azure AD key retrieval failed - redirecting to login");
            break;
          case "MISSING_TOKEN":
          case "MALFORMED_TOKEN":
          case "INVALID_PAYLOAD":
            console.warn("[API] Invalid token state - redirecting to login");
            break;
          default:
            // Handle simple "Authentication required" or other cases without specific error codes
            if (isSimpleAuthRequired) {
              console.warn("[API] Authentication required - no credentials provided");
            }
            break;
        }

        // For MSAL users with specific auth errors, clear session and redirect
        if (user && !user.isManualLogin) {
          console.log("[API] Clearing MSAL session and redirecting to login");

          // Clear user store
          useUserStore.getState().clearUser();

          // Try to clear MSAL session if available
          const instance = getMsalInstance();
          if (instance) {
            try {
              await instance.clearCache();
              // Redirect to Microsoft login to refresh session
              window.location.href = "/login";
              return Promise.reject(error);
            } catch (msalError) {
              console.error("[API] Failed to clear MSAL cache:", msalError);
            }
          }

          // Fallback redirect
          window.location.href = "/login";
          return Promise.reject(error);
        }
      }

      // Only handle token refresh for manual login users
      // MSAL users are handled above or by the global auth error handler
      if (user && user.isManualLogin) {
        const refreshToken = localStorage.getItem("rt");

        if (refreshToken) {
          originalRequest._retry = true;

          try {
            console.log("[API] Attempting token refresh for manual auth user");

            // Attempt to refresh the token
            const response = await API.post("/auth/refresh", {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Update stored tokens
            localStorage.setItem("mt", accessToken);
            localStorage.setItem("rt", newRefreshToken);

            console.log("[API] Token refresh successful");

            // Retry the original request with new token
            originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
            return API(originalRequest);
          } catch (refreshError) {
            console.warn("[API] Token refresh failed, logging out manual auth user");

            // Clear all auth data and redirect to manual login
            useUserStore.getState().clearUser();
            localStorage.removeItem("mt");
            localStorage.removeItem("rt");
            window.location.href = "/manualLogin";

            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token available for manual auth user
          console.warn("[API] No refresh token available for manual auth user, logging out");

          useUserStore.getState().clearUser();
          localStorage.removeItem("mt");
          window.location.href = "/manualLogin";
        }
      }
    }

    return Promise.reject(error);
  }
);
