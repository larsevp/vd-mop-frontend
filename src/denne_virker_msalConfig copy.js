// .env
// VITE_MSAL_CLIENT_ID=<app-id-fra-Entra-ID-appen>
// VITE_MSAL_TENANT_ID=<tenant-id> // Tenant ID for vanlig Entra ID

const TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID;     // Tenant ID for vanlig Entra ID

// Debug logging for å se nøyaktig hva som sendes
console.log('MSAL Config Debug:');
console.log('TENANT_ID:', TENANT_ID);
console.log('CLIENT_ID:', import.meta.env.VITE_MSAL_CLIENT_ID);
console.log('Authority:', `https://login.microsoftonline.com/${TENANT_ID}`);

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,

    // Standard Entra ID authority - la user flow håndteres av serveren:
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,

    redirectUri: window.location.origin,          // må være registrert på appen
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,                // sett true kun for gamle/IE-liknende nettlesere
    secureCookies: window.location.protocol === "https:",
  },
  system: {
    tokenRenewalOffsetSeconds: 300,
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        console.log(`MSAL [${level}]${containsPii ? " [PII]" : ""}: ${message}`);
      }
    },
  },
};

// Standard scopes for Entra ID med self-service signup
export const loginRequest = {
  scopes: ["openid", "profile", "User.Read"],
  // Prøv med self-service signup hint
  extraQueryParameters: {
    "domain_hint": "organizations",
    "login_hint": "", // tom for å trigge signup option
    "prompt": "" // force account selection som kan vise signup
  }
};

// Dedikert signup request for tydelig registrering
export const signupRequest = {
  scopes: ["openid", "profile", "User.Read"],
  extraQueryParameters: {
    "domain_hint": "organizations",
    "prompt": "create", // direkte til signup hvis støttet
    "login_hint": "" // tom for å trigge signup
  }
};

export const silentRequest = {
  scopes: ["openid", "profile"],
  account: null,
  forceRefresh: false,
};