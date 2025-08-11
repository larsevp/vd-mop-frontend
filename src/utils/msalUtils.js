/**
 * MSAL-specific utilities for authentication handling
 */

/**
 * Get return URL from location state
 */
export const getReturnUrl = (location) => {
  try {
    const urlParams = new URLSearchParams(location.search);
    const state = urlParams.get('state');
    if (state) {
      const parsedState = JSON.parse(state);
      return parsedState.returnUrl || '/';
    }
  } catch (error) {
    console.error('getReturnUrl - could not parse state parameter:', error);
  }
  return '/';
};

// Singleton reference for API usage
let _msalInstance = null;

export const registerMsalInstance = (instance) => {
  _msalInstance = instance;
  return instance;
};

export const getMsalInstance = () => _msalInstance;

// Simple hydration flag
let _msalHydrated = false;
export const setMsalHydrated = () => { _msalHydrated = true; };
export const isMsalHydrated = () => _msalHydrated;
