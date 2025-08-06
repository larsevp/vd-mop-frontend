import axios from 'axios';
import { useUserStore } from '../stores/userStore';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../msalConfig';

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

const msalInstance = new PublicClientApplication(msalConfig);

API.interceptors.request.use(async (config) => {
  const user = useUserStore.getState().user;
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  let account = null;
  if (user && user.id) {
    account = accounts.find(acc => acc.localAccountId === user.id || acc.homeAccountId === user.id);
  }
  // Always attach Authorization using found account, or fallback to first account
  if (!account && accounts.length > 0) {
    account = accounts[0];
  }
  if (account) {
    const { apiScope } = await import('../msalConfig');
    try {
      const result = await msalInstance.acquireTokenSilent({ scopes: [apiScope], account });
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Bearer ${result.accessToken}`;
    } catch (error) {
      throw error;
    }
  }
  // Only attach x-user-id if user is present
  if (user && user.id) {
    config.headers['x-user-id'] = user.id;
  }
  return config;
});

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // For 401 errors, ensure React Query will handle it by preserving the error structure
    // Always reject the promise so React Query can handle it
    return Promise.reject(error);
  }
);

export const getTiltak = () => API.get('/tiltak');
export const createTiltak = (data) => API.post('/tiltak', data);
export const deleteTiltak = (id) => API.delete(`/tiltak/${id}`);

export const getProsjekter = () => API.get('/prosjekt');
export const createProsjekt = (data) => API.post('/prosjekt', data);
