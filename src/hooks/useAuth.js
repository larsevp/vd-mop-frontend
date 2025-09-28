/**
 * Authentication Hook
 *
 * This hook manages the authentication state synchronization between MSAL
 * and the application's user store. It handles account detection, user extraction,
 * and authentication error management.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { useMsal } from "@azure/msal-react";
import { extractUserFromMsalAccount } from "../utils/authUtils";
import { setGlobalAuthErrorHandler } from "../queryClient";
import { getBrowserInfo } from "../utils/browserUtils";
import { isMsalHydrated } from "../utils/msalUtils";

export const useAuth = () => {
  const { accounts, instance } = useMsal();
  const setUser = useUserStore((state) => state.setUser);
  const user = useUserStore((state) => state.user);
  const [syncStatus, setSyncStatus] = useState("syncing");
  const [syncError, setSyncError] = useState(null);
  const [authErrorCount, setAuthErrorCount] = useState(0);
  const lastUserRef = useRef(null);
  const browserInfo = getBrowserInfo();

  // Reset error count periodically to allow recovery
  useEffect(() => {
    if (authErrorCount > 0) {
      const resetTimer = setTimeout(() => {
        setAuthErrorCount(0);
      }, 30000); // Reset after 30 seconds
      return () => clearTimeout(resetTimer);
    }
  }, [authErrorCount]);

  /**
   * Handle authentication errors from API calls
   * Determines whether to clear user state or show error message
   */
  const handleAuthError = useCallback(
    (error) => {
      // Prevent error storms by limiting consecutive error handling
      if (authErrorCount > 5) {
        return;
      }

      const currentAccounts = instance.getAllAccounts();
      const currentUser = useUserStore.getState().user;

      // Extract error message and code
      const errorCode = error?.response?.data?.code;
      const shouldRedirectToLogin = error?.response?.data?.shouldRedirectToLogin;
      let errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || "Authentication failed";

      // Handle AUTH_FAILED errors that should redirect to login immediately
      // Don't show error page, just let the API interceptor handle the redirect
      if (errorCode === "AUTH_FAILED" && shouldRedirectToLogin) {
        setUser(null);
        // Don't set syncStatus to 'error' - let the redirect happen cleanly
        return;
      }

      // Check if this is a token expiration/invalid token issue
      const isTokenExpired =
        error?.response?.status === 401 &&
        (error?.response?.data?.error === "invalid_token" ||
          error?.response?.data?.error === "expired_token" ||
          errorMessage.includes("token"));

      if (isTokenExpired && currentAccounts && currentAccounts.length > 0) {
        setSyncError("Token expired - refreshing...");
        return; // Don't clear user state, just show message
      }

      // Determine if this is a severe error that should clear user state
      const isSevere =
        ((!currentAccounts || currentAccounts.length === 0) && (!currentUser || !currentUser.isManualLogin)) ||
        error?.errorCode === "user_cancelled" ||
        error?.errorCode === "access_denied" ||
        error?.errorCode === "server_error";

      if (isSevere) {
        setSyncError(errorMessage);
        setSyncStatus("error");
        setUser(null);
      } else {
        setSyncError(errorMessage);
      }

      setAuthErrorCount((prev) => prev + 1);
    },
    [setUser, instance, authErrorCount]
  );

  useEffect(() => {
    setGlobalAuthErrorHandler(handleAuthError);
    return () => setGlobalAuthErrorHandler(null);
  }, [handleAuthError]);

  useEffect(() => {
    if (!isMsalHydrated()) {
      setSyncStatus("syncing");
      return;
    }

    // If no MSAL accounts, do NOT keep manual user (avoid masking lost session)
    if (!accounts || accounts.length === 0) {
      const currentUser = useUserStore.getState().user;
      if (currentUser && !currentUser.isManualLogin) {
        setUser(null);
        lastUserRef.current = null;
      }
      setSyncStatus("error");
      setSyncError("No authentication found");
      return;
    }

    const active = instance.getActiveAccount() || accounts[0];

    const userInfo = extractUserFromMsalAccount(active);

    if (userInfo) {
      const prev = lastUserRef.current;
      const changed = !prev || prev.id !== userInfo.id || prev.name !== userInfo.name;

      if (changed) {
        // Get current user state to preserve backend-fetched data (rolle, enhetId, etc.)
        const currentUser = useUserStore.getState().user;

        // Merge MSAL data with existing user data with proper field handling:
        // - MSAL provides: id, name (auth-related)
        // - Backend provides: navn, rolle, enhetId (business-related)
        const mergedUser = {
          ...currentUser, // Preserve backend data (navn, rolle, enhetId)
          id: userInfo.id, // MSAL auth ID (authoritative)
          name: userInfo.name, // MSAL display name (authoritative for auth)
          // Note: Keep backend's 'navn' field separate from MSAL's 'name'
          // Note: Email removed since it's not used in UI
        };

        setUser(mergedUser);
        lastUserRef.current = userInfo; // Still track MSAL-specific changes
      }
      setSyncStatus("success");
      setSyncError(null);
    }
  }, [accounts, instance, setUser]); // Removed 'user' to break loop

  return { syncStatus, syncError, instance, authErrorCount };
};
