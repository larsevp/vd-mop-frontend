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
    cacheLocation: "sessionStorage", // Use sessionStorage - clears when browser closes
    storeAuthStateInCookie: true, // Recommended for older browsers
    // Add secure cookie options
    secureCookies: window.location.protocol === "https:",
  },
  system: {
    // Improve token refresh behavior
    tokenRenewalOffsetSeconds: 300, // Refresh tokens 5 minutes before expiry
    // Completely disable all logging to avoid any sensitive information warnings
    loggerOptions: {
      loggerCallback: () => {
        // Completely silent - suppress all MSAL logs including PII warnings
      },
      piiLoggingEnabled: false,
      logLevel: 0, // LogLevel.Error (but callback will silence everything anyway)
    },
    // Additional options to minimize MSAL activity
    allowNativeBroker: false, // Disable native broker
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    // },
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
