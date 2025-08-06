import axios from 'axios';
import { useUserStore } from '../stores/userStore';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../msalConfig';

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

const msalInstance = new PublicClientApplication(msalConfig);

API.interceptors.request.use(async (config) => {
  console.log('API Interceptor: Making request to:', config.url);
  
  const user = useUserStore.getState().user;
  console.log('API Interceptor: Current user:', user);
  
  // Check if user has manual auth token (from manual login)
  if (user && user.manualToken) {
    console.log('API Interceptor: Using manual token');
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${user.manualToken}`;
    return config;
  }
  
  // Otherwise use MSAL authentication
  console.log('API Interceptor: Using MSAL authentication');
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  console.log('API Interceptor: MSAL accounts:', accounts);
  
  let account = null;
  if (user && user.id) {
    account = accounts.find(acc => acc.localAccountId === user.id || acc.homeAccountId === user.id);
  }
  // Always attach Authorization using found account, or fallback to first account
  if (!account && accounts.length > 0) {
    account = accounts[0];
  }
  
  console.log('API Interceptor: Using account:', account);
  
  if (account) {
    const { apiScope } = await import('../msalConfig');
    try {
      const result = await msalInstance.acquireTokenSilent({ scopes: [apiScope], account });
      console.log('API Interceptor: Got token:', result.accessToken ? 'Token acquired' : 'No token');
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${result.accessToken}`;
    } catch (error) {
      console.error('API Interceptor: Token acquisition failed:', error);
      throw error;
    }
  } else {
    console.log('API Interceptor: No account found, proceeding without token');
  }
  
  // Only attach x-user-id if user is present
  if (user && user.id) {
    config.headers['x-user-id'] = user.id;
  }
  return config;
});

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => {
    console.log('API Response: Success for', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('API Response: Error for', error.config?.url, 'Status:', error.response?.status, 'Data:', error.response?.data);
    // For 401 errors, ensure React Query will handle it by preserving the error structure
    // Always reject the promise so React Query can handle it
    return Promise.reject(error);
  }
);
