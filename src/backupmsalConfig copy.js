// Fill in your Azure AD app details here





export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",
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
    // Enable detailed logging for debugging
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) {
          console.log(`MSAL [${level}]: ${message}`);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 3, // LogLevel.Verbose for debugging
    },
    // Additional options to minimize MSAL activity
    allowNativeBroker: false, // Disable native broker
    windowHashTimeout: 60000,
    iframeHashTimeout: 6000,
    loadFrameTimeout: 0,
    // },
  },
};

//export const apiScope = "https://graph.microsoft.com/User.Read";

export const loginRequest = {
  //scopes: ["openid", "profile", "email", apiScope],
  scopes: ["openid"],
  prompt: "select_account", // Always show account picker
  // Add extra parameters for better session handling
  extraQueryParameters: {
    // Request longer-lived tokens where possible
    max_age: "0", // Force fresh authentication occasionally
    domain_hint: "veidekke.no"
  }
};

// Silent token request configuration
export const silentRequest = {
  scopes: ["openid"],
  account: null, // Will be set dynamically
  forceRefresh: false, // Only refresh when necessary
};
