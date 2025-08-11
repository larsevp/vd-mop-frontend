/**
 * API Client Configuration
 * 
 * This file sets up the Axios client with automatic authentication token handling.
 * It includes request interceptors that automatically attach MSAL tokens to API calls.
 */

import axios from 'axios';
import { useUserStore } from '../stores/userStore';
import { getMsalInstance } from '../utils/msalUtils';

// Create the main API client
export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
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
    const manualToken = user.manualToken || localStorage.getItem('mt');
    if (manualToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${manualToken}`;
      if (user.id) config.headers['x-user-id'] = user.id;
      console.log('[API] Using manual token for request');
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
        account = accounts.find(acc => 
          acc.localAccountId === user.id || acc.homeAccountId === user.id
        );
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
            forceRefresh: false
          });
          
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${result.accessToken}`;
          
          console.log('[API] Token acquired successfully, expires:', new Date(result.expiresOn));
          console.log('[API] Token preview:', result.accessToken.substring(0, 50) + '...');
          console.log('[API] Token parts count:', result.accessToken.split('.').length);
          
          // Debug: decode token to see what we're sending
          try {
            const tokenParts = result.accessToken.split('.');
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('[API] Token payload - iss:', payload.iss, 'aud:', payload.aud, 'exp:', payload.exp);
          } catch (decodeError) {
            console.warn('[API] Could not decode token for debugging:', decodeError);
          }
          
        } catch (tokenError) {
          console.warn('[API] Token acquisition failed:', tokenError.errorCode);
          // Don't implement complex retry logic here - let the auth error handler manage it
          // The request will proceed without a token and the server will return 401 if needed
        }
      } else {
        console.warn('[API] No MSAL account found for token acquisition');
      }
      
      // Always add user ID header if available
      if (user.id) {
        config.headers = config.headers || {};
        config.headers['x-user-id'] = user.id;
      }
      
    } catch (error) {
      console.error('[API] MSAL token pipeline failed:', error);
    }
  }
  
  return config;
});

/**
 * Response Interceptor
 * Currently just passes through responses and errors
 * Could be extended for global response handling
 */
API.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
