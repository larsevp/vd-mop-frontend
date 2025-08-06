import { useUserStore } from '../stores/userStore';
import { useMsal } from '@azure/msal-react';

/**
 * Unified logout hook that handles both MSAL and manual authentication
 * Automatically detects authentication type and performs appropriate logout
 */
export function useLogout() {
  const { instance } = useMsal();
  const { user, clearUser } = useUserStore();

  const logout = async (redirectTo = '/login') => {
    try {
      // Check if user is logged in via manual authentication
      if (user && user.isManualLogin) {
        // Manual login logout - clear local state, token, and redirect
        clearUser();
        localStorage.removeItem('mt'); // Remove manual token
        window.location.href = redirectTo;
        return;
      }

      // MSAL logout - clear cache locally without redirecting to Microsoft
      if (instance) {
        // Clear all MSAL cache and tokens
        await instance.clearCache();
        
        // Clear user state
        clearUser();
        
        // Navigate to specified page (default: login page) with full reload
        window.location.href = redirectTo;
      }
    } catch (error) {
      // Fallback: always clear local state and redirect
      clearUser();
      localStorage.removeItem('mt'); // Remove manual token on error too
      window.location.href = redirectTo;
    }
  };

  return { logout };
}
