import { useEffect, useState } from 'react';
import { useMsal } from '@azure/msal-react';
import { useUserStore } from '../stores/store';
import { getCurrentUserInfo } from '../api/userApi';
import { setGlobalAuthErrorHandler } from '../queryClient';

export const useAuth = () => {
  const { accounts, instance } = useMsal();
  const setUser = useUserStore(state => state.setUser);
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'syncing', 'success', 'error'
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    const handleAuthError = (error) => {
      console.error('[useAuth] Received auth error:', error);
      setSyncError(error?.response?.data?.message || error?.message || 'Authentication failed');
      setSyncStatus('error');
    };

    setGlobalAuthErrorHandler(handleAuthError);

    async function syncUser() {
      if (accounts && accounts.length > 0) {
        try {
          setSyncStatus('syncing');
          setSyncError(null);

          const user = await getCurrentUserInfo();
          if (!user) {
            throw new Error('Could not extract user information from token');
          }

          setUser(user);
          setSyncStatus('success');
        } catch (error) {
          console.error('[useAuth] Error syncing user:', error);
          setSyncError(error.message || 'Failed to extract user information');
          setSyncStatus('error');
        }
      }
    }

    syncUser();

    return () => {
      setGlobalAuthErrorHandler(null);
    };
  }, [accounts, setUser, instance]);

  return { syncStatus, syncError, instance };
};
