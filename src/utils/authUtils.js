import { useUserStore } from '../stores/userStore';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../msalConfig';

const msalInstance = new PublicClientApplication(msalConfig);

// Helper to get current user info (supports both MSAL and manual login)
export async function getCurrentUserInfo() {
  const user = useUserStore.getState().user;
  
  // If user is logged in via manual authentication
  if (user && user.isManualLogin) {
    return {
      id: user.id,
      name: user.navn || user.name,
      email: user.epost || user.email
    };
  }
  
  // For MSAL/SSO users
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

// Helper to extract user info from MSAL account (for useAuth hook)
export function extractUserFromMsalAccount(account) {
  if (!account) return null;
  return {
    id: account.localAccountId || account.homeAccountId,
    name: account.name || account.username,
    email: account.username
  };
}
