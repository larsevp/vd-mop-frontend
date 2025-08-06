import { useEffect } from 'react';
import { useUserStore } from '../stores/userStore';

/**
 * Component responsible for initializing user data on app load
 * Handles fetching user role and info for SSO users
 */
export default function UserInitializer({ children }) {
  const { user, fetchUserInfo } = useUserStore();
  
  useEffect(() => {
    // Only fetch user info for SSO users who don't have role data yet
    // Manual login users already have complete user data from login response
    const shouldFetchUserInfo = user && !user.isManualLogin && !user.rolle;
    
    if (shouldFetchUserInfo) {
      console.log('UserInitializer: Fetching user info for SSO user');
      fetchUserInfo();
    } else {
      console.log('UserInitializer: Skipping user info fetch', {
        hasUser: !!user,
        isManualLogin: user?.isManualLogin,
        hasRole: !!user?.rolle
      });
    }
  }, [user?.isManualLogin, user?.rolle, fetchUserInfo]);

  // Always render children - user info fetching happens in background
  return children;
}
