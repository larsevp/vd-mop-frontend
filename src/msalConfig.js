// Fill in your Azure AD app details here
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID}`,
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage", // Use localStorage for token caching
    storeAuthStateInCookie: true, // Recommended for older browsers
  },
};

export const apiScope = "api://d0fa50d2-9184-47e5-82c5-2f5668d3a532/.default";
export const loginRequest = {
  scopes: [apiScope],
  prompt: "select_account"
};
