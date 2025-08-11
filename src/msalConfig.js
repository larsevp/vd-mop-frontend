/**
 * MSAL Configuration for Azure AD Authentication
 * 
 * This file contains the Microsoft Authentication Library (MSAL) configuration
 * for connecting to Azure Active Directory (Entra ID).
 * 
 * Environment Variables Required:
 * - VITE_MSAL_CLIENT_ID: Application (client) ID from Azure AD app registration
 * - VITE_MSAL_TENANT_ID: Directory (tenant) ID from Azure AD
 */

import { LogLevel } from '@azure/msal-browser';

const TENANT_ID = import.meta.env.VITE_MSAL_TENANT_ID;
const CLIENT_ID = import.meta.env.VITE_MSAL_CLIENT_ID;

// Validate required environment variables
if (!CLIENT_ID || !TENANT_ID) {
  throw new Error('Missing required MSAL environment variables. Please check VITE_MSAL_CLIENT_ID and VITE_MSAL_TENANT_ID');
}

/**
 * MSAL Instance Configuration
 */
export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: `${window.location.origin}/auth-redirect`,
    postLogoutRedirectUri: `${window.location.origin}/login`,
    navigateToLoginRequestUrl: false, // We handle navigation manually
  },
  cache: {
    cacheLocation: 'localStorage', // Store tokens in localStorage for persistence
    storeAuthStateInCookie: true,  // Required for Safari ITP compatibility
  },
  system: {
    iframeHashTimeout: 10000,      // Timeout for silent token renewal
    allowNativeBroker: false,      // Disable native broker for simplicity
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return; // Don't log PII
        
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message);
            return;
          case LogLevel.Info:
            console.info('[MSAL]', message);
            return;
          case LogLevel.Verbose:
            console.debug('[MSAL]', message);
            return;
          case LogLevel.Warning:
            console.warn('[MSAL]', message);
            return;
        }
      },
      logLevel: LogLevel.Warning, // Only log warnings and errors by default
    },
  },
};

/**
 * Login Request Configuration
 */
export const loginRequest = {
  scopes: ['User.Read'], // Basic profile information
  prompt: 'select_account', // Always show account picker for clarity
};

/**
 * Signup Request Configuration (for new account creation)
 */
export const signupRequest = {
  scopes: ['User.Read'],
  prompt: 'create', // Force account creation flow
};