import { useUserStore } from '../stores/userStore';
import { getMsalInstance } from '../utils/msalUtils';

// Helper to get current user info (supports both MSAL and manual login)
export function getCurrentUserInfo() {
  const user = useUserStore.getState().user;
  if (user && user.isManualLogin) {
    return { id: user.id, name: user.navn || user.name, email: user.epost || user.email };
  }

  const instance = getMsalInstance();
  if (!instance) return null;

  let accounts = [];
  try { accounts = instance.getAllAccounts() || []; } catch { return null; }
  if (accounts.length === 0) return null;

  let active = instance.getActiveAccount();
  if (!active) {
    if (accounts.length === 1) {
      active = accounts[0];
      instance.setActiveAccount(active);
      console.log('Active account set (single account):', active.username);
    } else {
      // Multiple accounts with no active selection – caller can trigger account picker
      return null;
    }
  }

  return {
    id: active.localAccountId || active.homeAccountId,
    name: active.name || active.username,
    email: active.username
  };
}

export function extractUserFromMsalAccount(account) {
  if (!account) return null;
  return { id: account.localAccountId || account.homeAccountId, name: account.name || account.username, email: account.username };
}
