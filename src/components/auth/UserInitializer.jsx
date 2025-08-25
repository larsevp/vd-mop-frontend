import { useEffect } from "react";
import { useUserStore } from "@/stores/userStore";

/**
 * Component responsible for initializing user data on app load
 * Handles fetching user role and info for SSO users
 */
export default function UserInitializer({ children }) {
  const { user, fetchUserInfo } = useUserStore();

  useEffect(() => {
    // Fetch user info for:
    // 1. SSO users who don't have role data yet
    // 2. Manual login users who don't have enhetId yet
    const shouldFetchUserInfo = user && ((!user.isManualLogin && !user.rolle) || (user.isManualLogin && !user.enhetId));

    if (shouldFetchUserInfo) {
      //console.log('UserInitializer: Fetching user info');
      fetchUserInfo();
    } else {
      /*console.log('UserInitializer: Skipping user info fetch', {
        hasUser: !!user,
        isManualLogin: user?.isManualLogin,
        hasRole: !!user?.rolle,
        hasEnhetId: !!user?.enhetId
      });*/
    }
  }, [user?.isManualLogin, user?.rolle, user?.enhetId, fetchUserInfo]);

  // Always render children - user info fetching happens in background
  return children;
}
