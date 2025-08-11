// .env
// VITE_MSAL_CLIENT_ID=<app-id-fra-Entra-ID-appen>
// VITE_MSAL_TENANT_ID=<tenant-id> // Tenant ID for vanlig Entra ID

// Simplified config: remove Safari-layered overrides for debugging Safari refresh issue

const TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID;     // Tenant ID for vanlig Entra ID
/*
console.log('MSAL Config Debug:');
console.log('TENANT_ID:', TENANT_ID);
console.log('CLIENT_ID:', import.meta.env.VITE_MSAL_CLIENT_ID);
console.log('Authority:', `https://login.microsoftonline.com/${TENANT_ID}`);
*/
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: window.location.origin + "/login",
    postLogoutRedirectUri: window.location.origin + "/login",
    navigateToLoginRequestUrl: false, // avoids redirect loop on reload
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true,       // mitigates Safari/ITP quirks
  },
  system: {
    iframeHashTimeout: 10000,           // optional: give silent renew a bit more time
  }
};

export const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read'],
};

export const signupRequest = {
  scopes: ['openid', 'profile', 'User.Read'],
  extraQueryParameters: {
    prompt: 'create',
  }
};

export const silentRequest = {
  scopes: ['openid', 'profile', 'User.Read'],
  account: null,
  forceRefresh: false,
};