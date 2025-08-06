import { useEffect, useState, useCallback } from 'react';
import { useMsal } from '@azure/msal-react';
import { useUserStore } from '../stores/store';
import { getCurrentUserInfo } from '../api/userApi';
import { setGlobalAuthErrorHandler } from '../queryClient';

export const useAuth = () => {
  const { accounts, instance } = useMsal();
  const setUser = useUserStore(state => state.setUser);
  const [syncStatus, setSyncStatus] = useState('success'); // Start optimistic - let backend validate
  const [syncError, setSyncError] = useState(null);
  const [authErrorCount, setAuthErrorCount] = useState(0); // Force re-renders on auth errors

  const handleAuthError = useCallback((error) => {
    setSyncError(error?.response?.data?.message || error?.message || 'Authentication failed');
    setSyncStatus('error');
    setAuthErrorCount(prev => prev + 1); // Trigger re-render
    // Clear user data when auth fails
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    setGlobalAuthErrorHandler(handleAuthError);

    // Extract user info from MSAL token (optimistic approach)
    // Let backend validate user existence on first API call
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      setUser({
        id: account.localAccountId || account.homeAccountId,
        name: account.name || account.username,
        email: account.username
      });
      setSyncStatus('success');
    }

    return () => {
      setGlobalAuthErrorHandler(null);
    };
  }, [accounts, setUser, instance, handleAuthError]);

  return { syncStatus, syncError, instance, authErrorCount };
};
