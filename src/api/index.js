import axios from 'axios';
import { useUserStore } from '../stores/userStore';
import { getMsalInstance } from '../utils/msalUtils';

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Removed separate PublicClientApplication to avoid duplicate instances.

API.interceptors.request.use(async (config) => {
  const user = useUserStore.getState().user;
  const instance = getMsalInstance();
  
  if (user && user.isManualLogin) {
    const manualToken = localStorage.getItem('mt');
    if (manualToken) {
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${manualToken}`;
      if (user.id) config.headers['x-user-id'] = user.id;
      return config;
    }
  }
  
  if (user && user.manualToken) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${user.manualToken}`;
    if (user.id) config.headers['x-user-id'] = user.id;
    return config;
  }
  
  if (user && !user.isManualLogin && instance) {
    try {
      const accounts = instance.getAllAccounts();
      let account = null;
      if (user.id) account = accounts.find(acc => acc.localAccountId === user.id || acc.homeAccountId === user.id);
      if (!account && accounts.length > 0) account = accounts[0];
      if (account) {
        try {
          const result = await instance.acquireTokenSilent({
            scopes: ["User.Read"],
            account: account,
            forceRefresh: false // Try cache first
          });
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${result.accessToken}`;
          console.log('Token acquired successfully, expires:', new Date(result.expiresOn));
        } catch (tokenError) {
          console.log('Token acquisition failed:', tokenError.errorCode);
          // Try force refresh if silent fails
          if (tokenError.errorCode === 'token_renewal_required' || 
              tokenError.errorCode === 'invalid_grant' ||
              tokenError.errorCode === 'expired_token') {
            try {
              const refreshResult = await instance.acquireTokenSilent({
                scopes: ["User.Read"],
                account: account,
                forceRefresh: true
              });
              config.headers = config.headers || {};
              config.headers['Authorization'] = `Bearer ${refreshResult.accessToken}`;
              console.log('Token force-refreshed successfully');
            } catch (refreshError) {
              console.warn('Token refresh also failed:', refreshError.errorCode);
            }
          }
          // Proceed without token on expected interaction errors
          if (!['consent_required','interaction_required','login_required'].includes(tokenError.errorCode)) {
            console.warn('Unexpected token acquisition error:', tokenError);
          }
        }
      }
      if (user.id) {
        config.headers = config.headers || {};
        config.headers['x-user-id'] = user.id;
      }
    } catch (error) {
      console.error('MSAL token pipeline failed:', error);
    }
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
