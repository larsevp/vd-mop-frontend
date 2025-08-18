import { useUserStore } from "@/stores/userStore";
import { useMsal } from "@azure/msal-react";

/**
 * Unified logout hook that handles both MSAL and manual authentication
 * Automatically detects authentication type and performs appropriate logout
 */
export function useLogout() {
  const { instance } = useMsal();
  const { user, clearUser } = useUserStore();

  const logout = async (redirectTo = "/login") => {
    try {
      // Check if user is logged in via manual authentication
      if (user && user.isManualLogin) {
        // Manual login logout - clear local state, tokens, and redirect
        clearUser();
        localStorage.removeItem("mt"); // Remove access token
        localStorage.removeItem("rt"); // Remove refresh token
        window.location.href = redirectTo;
        return;
      }

      // MSAL logout - use logoutRedirect for cleanup and redirect
      if (instance) {
        clearUser();
        await instance.logoutRedirect({ postLogoutRedirectUri: window.location.origin + redirectTo });
      } else {
        window.location.href = redirectTo;
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Fallback: always clear local state and redirect
      clearUser();
      window.location.href = redirectTo;
    }
  };

  return { logout };
}
