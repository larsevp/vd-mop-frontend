// Frontend token refresh implementation for manual authentication only
// This module handles token refresh specifically for manual auth users
// and does not interfere with MSAL token management

import { API } from "@/api/index";
import { useUserStore } from "@/stores/userStore";

/**
 * Check if access token is about to expire and refresh it proactively
 * Only works for manual authentication users
 */
export const checkAndRefreshToken = async () => {
  const user = useUserStore.getState().user;

  // Only handle manual auth users
  if (!user || !user.isManualLogin) {
    return;
  }

  const accessToken = localStorage.getItem("mt");
  const refreshToken = localStorage.getItem("rt");

  if (!accessToken || !refreshToken) {
    return;
  }

  try {
    // Decode the access token to check expiration
    const tokenParts = accessToken.split(".");
    if (tokenParts.length !== 3) {
      return;
    }

    const payload = JSON.parse(atob(tokenParts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;

    // Verify this is a manual auth token
    if (payload.iss !== "manual-auth-issuer") {
      return;
    }

    // Refresh if token expires in less than 5 minutes
    if (timeUntilExpiry < 300) {
      console.log("[Token] Proactively refreshing manual auth token (expires in", timeUntilExpiry, "seconds)");

      const response = await API.post("/auth/refresh", { refreshToken });
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

      localStorage.setItem("mt", newAccessToken);
      localStorage.setItem("rt", newRefreshToken);

      console.log("[Token] Manual auth token refreshed successfully");
    }
  } catch (error) {
    console.warn("[Token] Proactive manual auth token refresh failed:", error);

    // If refresh fails, we'll let the response interceptor handle it
    // when the next API call is made
  }
};

/**
 * Set up periodic token checking for manual auth users only
 */
export const startTokenMonitoring = () => {
  // Check token every 2 minutes
  setInterval(() => {
    const user = useUserStore.getState().user;
    // Only monitor manual auth users
    if (user && user.isManualLogin) {
      checkAndRefreshToken();
    }
  }, 2 * 60 * 1000);

  // Also check when page becomes visible (for manual auth users only)
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      const user = useUserStore.getState().user;
      if (user && user.isManualLogin) {
        checkAndRefreshToken();
      }
    }
  });

  // console.log("[Token] Token monitoring started for manual auth users");
};
