// Fill in your Azure AD app details here
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID}`,
    redirectUri: window.location.origin,
    // Add post logout redirect for cleaner logout experience
    postLogoutRedirectUri: window.location.origin,
    // Improve navigation handling
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "localStorage", // Use localStorage for token caching
    storeAuthStateInCookie: true, // Recommended for older browsers
    // Add secure cookie options
    secureCookies: window.location.protocol === "https:",
  },
  system: {
    // Improve token refresh behavior
    tokenRenewalOffsetSeconds: 300, // Refresh tokens 5 minutes before expiry
    // Add logging for debugging
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(`MSAL ${level}: ${message}`);
      },
      piiLoggingEnabled: false,
      logLevel: import.meta.env.NODE_ENV === 'development' ? 'Info' : 'Error',
    },
  },
};

export const apiScope = "api://d0fa50d2-9184-47e5-82c5-2f5668d3a532/.default";

export const loginRequest = {
  scopes: [apiScope],
  prompt: "select_account", // Always show account picker
  // Add extra parameters for better session handling
  extraQueryParameters: {
    // Request longer-lived tokens where possible
    max_age: "0" // Force fresh authentication occasionally
  }
};

// Silent token request configuration
export const silentRequest = {
  scopes: [apiScope],
  account: null, // Will be set dynamically
  forceRefresh: false, // Only refresh when necessary
};
