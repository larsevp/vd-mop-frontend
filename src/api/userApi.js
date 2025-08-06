import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../msalConfig';
import { API } from './index';

const msalInstance = new PublicClientApplication(msalConfig);

// Helper to get current MSAL account and claims
export async function getCurrentUserInfo() {
  await msalInstance.initialize();
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length === 0) return null;
  const account = accounts[0];
  // Extract user info for frontend use
  return {
    id: account.localAccountId || account.homeAccountId,
    name: account.name || account.username,
    email: account.username
  };
}

// CRUD API for users (admin functionality)
export async function getUsers() {
  return API.get('/user');
}

export async function createUser(user) {
  return API.post('/user', user);
}

export async function updateUser(user) {
  return API.put(`/user/${user.id}`, user);
}

export async function deleteUser(id) {
  return API.delete(`/user/${id}`);
}
