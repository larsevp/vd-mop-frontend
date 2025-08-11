/**
 * MSAL Utility Functions
 * 
 * This file provides utility functions for managing MSAL instances,
 * extracting return URLs, and handling MSAL state management.
 */

// Global MSAL instance storage
let msalInstance = null;
let msalHydrated = false;

/**
 * Register the MSAL instance for global access
 * Should be called once during app initialization
 * 
 * @param {PublicClientApplication} instance - The MSAL instance
 */
export const registerMsalInstance = (instance) => {
  msalInstance = instance;
  console.log('[MSAL Utils] Instance registered');
};

/**
 * Get the registered MSAL instance
 * 
 * @returns {PublicClientApplication|null} The MSAL instance or null if not registered
 */
export const getMsalInstance = () => {
  if (!msalInstance) {
    console.warn('[MSAL Utils] No MSAL instance registered');
  }
  return msalInstance;
};

/**
 * Mark MSAL as hydrated (finished initialization)
 * Should be called after MSAL instance is created
 */
export const setMsalHydrated = () => {
  msalHydrated = true;
  console.log('[MSAL Utils] MSAL marked as hydrated');
};

/**
 * Check if MSAL has finished hydrating
 * 
 * @returns {boolean} True if MSAL is hydrated
 */
export const isMsalHydrated = () => {
  return msalHydrated;
};

/**
 * Extract the return URL from the current location
 * Used to redirect users to their intended destination after login
 * 
 * @param {object} location - React Router location object
 * @returns {string} The return URL or default to '/'
 */
export const getReturnUrl = (location) => {
  // Check URL search params first (e.g., ?returnUrl=/dashboard)
  const urlParams = new URLSearchParams(location.search);
  const returnUrl = urlParams.get('returnUrl');
  
  if (returnUrl) {
    console.log('[MSAL Utils] Return URL from params:', returnUrl);
    return returnUrl;
  }
  
  // If no explicit return URL, use current pathname (but not login/auth pages)
  const currentPath = location.pathname;
  const authPages = ['/login', '/auth-redirect', '/manualLogin'];
  
  if (!authPages.includes(currentPath) && currentPath !== '/') {
    console.log('[MSAL Utils] Return URL from current path:', currentPath);
    return currentPath;
  }
  
  // Default to home page
  console.log('[MSAL Utils] Using default return URL: /');
  return '/';
};
