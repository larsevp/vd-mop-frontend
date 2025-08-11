const TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID; // GUID eller domene-ID (ikke brukt i CIAM-authority)
const TENANT_NAME = import.meta.env.VITE_MSAL_TENANT_NAME; // f.eks. "veidekke" (prefix for veidekke.onmicrosoft.com)
const USER_FLOW_NAME = "B2X_1_veidekke_sign_in_v2"; // din sign-up/sign-in user flow


export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MSAL_CLIENT_ID,

    // AKTIV: CIAM / External ID user flow (logg inn + registrer deg)
    //authority: `https://${TENANT_NAME}.ciamlogin.com/${TENANT_NAME}.onmicrosoft.com/${USER_FLOW_NAME}`,

    // PRØVD TIDLIGERE (beholdt som referanse):
    authority: `https://login.microsoftonline.com/${TENANT_ID}/`,
    // authority: `https://login.microsoftonline.com/tfp/${TENANT_ID}/${USER_FLOW_NAME}`,
    // authority: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/authorize?p=B2X_1_veidekke_sign_in_v2`,
    // Viktig for MSAL tillit til CIAM domenet
    //authority:`https://${TENANT_NAME}.b2clogin.com/${TENANT_NAME}onmicrosoft.com/oauth2/v2.0/authorize
  //?p=B2X_1_veidekke_sign_in_v2`,
    //knownAuthorities: [`${TENANT_NAME}.b2clogin.com`],
    //knownAuthorities: [`${TENANT_NAME}.ciamlogin.com`],
    //authority:  "https://login.microsoftonline.com/organizations", - krever godkjenning
    redirectUri: window.location.origin,          // må være registrert i appen i samme tenant som flowen
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: true,
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

export const loginRequest = {
  scopes: ["openid",  "email"], // evt. legg til "offline_access" hvis du trenger refresh tokens
};

export const silentRequest = {
  scopes: ["openid"],
  account: null,
  forceRefresh: false,
};
