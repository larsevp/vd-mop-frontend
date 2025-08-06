import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from '../stores/userStore';
import { useMsal } from '@azure/msal-react';
import { extractUserFromMsalAccount, getCurrentUserInfo } from '../utils/authUtils';
import { setGlobalAuthErrorHandler } from '../queryClient';

export const useAuth = () => {
  const { accounts, instance } = useMsal();
  const setUser = useUserStore(state => state.setUser);
  const [syncStatus, setSyncStatus] = useState('success'); // Start optimistic - let backend validate
  const [syncError, setSyncError] = useState(null);
  const [authErrorCount, setAuthErrorCount] = useState(0); // Force re-renders on auth errors

  const handleAuthError = useCallback((error) => {
    console.error('Auth error details:', {
      status: error?.response?.status,
      data: error?.response?.data,
      message: error?.message,
      full_error: error
    });
    setSyncError(error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Authentication failed');
    setSyncStatus('error');
    setAuthErrorCount(prev => prev + 1); // Trigger re-render
    // Clear user data when auth fails
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    // RE-ENABLED - to see auth errors during debugging
    setGlobalAuthErrorHandler(handleAuthError);

    // Extract user info from MSAL token (optimistic approach)
    // Let backend validate user existence on first API call
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      const userInfo = extractUserFromMsalAccount(account);
      console.log('Setting user from MSAL:', userInfo);
      if (userInfo) {
        setUser(userInfo);
        setSyncStatus('success');
      }
    } else {
      console.log('No MSAL accounts found');
    }

    return () => {
      setGlobalAuthErrorHandler(null);
    };
  }, [accounts, setUser, instance, handleAuthError]);

  return { syncStatus, syncError, instance, authErrorCount };
};
