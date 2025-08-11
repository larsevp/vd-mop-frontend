/**
 * Authentication Flow Handlers
 * 
 * This file contains the core authentication flow functions for login, signup, and logout.
 * These functions implement best practices for MSAL interaction management and error handling.
 */

import { getReturnUrl } from './msalUtils';

// Rate limiting to prevent rapid authentication attempts
let lastLoginAttempt = 0;
const LOGIN_DEBOUNCE_MS = 2000;

/**
 * Clear stuck MSAL interaction state from browser storage
 * 
 * @param {PublicClientApplication} instance - MSAL instance
 * @returns {boolean} True if stuck state was found and cleared
 */
const clearStuckInteractionState = (instance) => {
  try {
    const config = instance.getConfiguration();
    const storage = config.cache.cacheLocation === 'localStorage' 
      ? window.localStorage 
      : window.sessionStorage;
    
    // Find MSAL interaction-related keys that might be stuck
    const stuckKeys = Object.keys(storage).filter(key => 
      key.includes('msal') && (
        key.includes('interaction') || 
        key.includes('request') || 
        key.includes('state')
      )
    );
    
    if (stuckKeys.length > 0) {
      console.warn('[Auth] Found stuck MSAL interaction keys:', stuckKeys);
      stuckKeys.forEach(key => {
        storage.removeItem(key);
        console.log('[Auth] Cleared stuck key:', key);
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[Auth] Error clearing stuck interaction state:', error);
    return false;
  }
};

/**
 * Check if there's an ongoing MSAL interaction
 * 
 * @param {PublicClientApplication} instance - MSAL instance
 * @returns {boolean} True if interaction is in progress
 */
const isInteractionInProgress = (instance) => {
  try {
    const config = instance.getConfiguration();
    const storage = config.cache.cacheLocation === 'localStorage' 
      ? window.localStorage 
      : window.sessionStorage;
    
    const interactionStatus = storage.getItem('msal.interaction.status');
    return interactionStatus && interactionStatus !== 'none';
  } catch (error) {
    console.warn('[Auth] Could not check interaction status:', error);
    return false;
  }
};

/**
 * Handle user login flow
 * Implements rate limiting, interaction checks, and proper error handling
 */
export const handleLogin = async ({
  instance,
  loginRequest,
  location,
  navigate,
  setIsLoggingIn,
  setLoginError,
  isLoggingIn,
  isSigningUp,
}) => {
  // Rate limiting to prevent rapid clicks
  const now = Date.now();
  if (now - lastLoginAttempt < LOGIN_DEBOUNCE_MS) {
    console.log('[Auth] Login attempt debounced');
    return;
  }
  lastLoginAttempt = now;

  // Prevent multiple simultaneous login attempts
  if (isLoggingIn || isSigningUp) {
    console.log('[Auth] Login already in progress locally');
    return;
  }

  // Check for stuck MSAL interaction state
  if (isInteractionInProgress(instance)) {
    console.warn('[Auth] MSAL interaction already in progress');
    return;
  }

  setIsLoggingIn(true);
  setLoginError(null);
  
  try {
    // Check if user is already authenticated
    const activeAccount = instance.getActiveAccount();
    const allAccounts = instance.getAllAccounts();
    
    console.log('[Auth] Checking existing authentication...');
    console.log('[Auth] Active account:', activeAccount?.username || 'none');
    console.log('[Auth] Total accounts:', allAccounts.length);
    
    if (activeAccount || allAccounts.length > 0) {
      console.log('[Auth] User already authenticated, redirecting...');
      const returnUrl = getReturnUrl(location);
      setIsLoggingIn(false);
      navigate(returnUrl, { replace: true });
      return;
    }

    // Start login flow
    console.log('[Auth] Starting login flow...');
    const returnUrl = getReturnUrl(location);
    const state = JSON.stringify({ 
      returnUrl, 
      timestamp: Date.now(), 
      mode: 'login' 
    });
    
    await instance.loginRedirect({ 
      ...loginRequest, 
      state 
    });
    
  } catch (error) {
    console.error('[Auth] Login failed:', error);
    
    // Handle specific MSAL errors
    if (error.errorCode === 'interaction_in_progress') {
      console.warn('[Auth] Interaction in progress error - attempting recovery');
      
      const cleared = clearStuckInteractionState(instance);
      const errorMessage = cleared 
        ? 'Authentication state was reset. Please try again.'
        : 'Authentication is busy. Please refresh the page and try again.';
      
      setLoginError(errorMessage);
    } else {
      setLoginError('Login failed. Please try again.');
    }
    
    setIsLoggingIn(false);
  }
};

/**
 * Handle user signup flow
 * Similar to login but forces account creation
 */
export const handleSignup = async ({
  instance,
  signupRequest,
  location,
  setIsSigningUp,
  setLoginError,
  isSigningUp,
  isLoggingIn,
}) => {
  // Prevent multiple simultaneous signup attempts
  if (isSigningUp || isLoggingIn) {
    console.log('[Auth] Signup already in progress locally');
    return;
  }

  // Check for stuck MSAL interaction state
  if (isInteractionInProgress(instance)) {
    console.warn('[Auth] MSAL interaction already in progress');
    return;
  }

  setIsSigningUp(true);
  setLoginError(null);
  
  try {
    console.log('[Auth] Starting signup flow...');
    const returnUrl = getReturnUrl(location);
    const state = JSON.stringify({ 
      returnUrl, 
      timestamp: Date.now(), 
      mode: 'signup' 
    });
    
    await instance.loginRedirect({ 
      ...signupRequest, 
      state 
    });
    
  } catch (error) {
    console.error('[Auth] Signup failed:', error);
    
    // Handle specific MSAL errors
    if (error.errorCode === 'interaction_in_progress') {
      console.warn('[Auth] Interaction in progress during signup - attempting recovery');
      
      const cleared = clearStuckInteractionState(instance);
      const errorMessage = cleared 
        ? 'Authentication state was reset. Please try again.'
        : 'Authentication is busy. Please refresh the page and try again.';
      
      setLoginError(errorMessage);
    } else {
      setLoginError('Signup failed. Please try again.');
    }
    
    setIsSigningUp(false);
  }
};

/**
 * Handle user logout flow
 * Clears all authentication state and redirects to login
 */
export const handleLogout = async ({ logout, setIsLoggingOut }) => {
  setIsLoggingOut(true);
  
  try {
    console.log('[Auth] Starting logout flow...');
    await logout('/login');
  } catch (error) {
    console.error('[Auth] Logout failed, forcing redirect:', error);
    // Force redirect if logout fails
    window.location.href = '/login';
  } finally {
    setIsLoggingOut(false);
  }
};

/**
 * Development utility to clear all MSAL state
 * Available in browser console as window.clearAllMsalState()
 */
if (typeof window !== 'undefined') {
  window.clearAllMsalState = () => {
    console.log('[Auth] Clearing all MSAL state...');
    const keys = Object.keys(localStorage).filter(key => key.startsWith('msal'));
    keys.forEach(key => {
      console.log('[Auth] Removing:', key);
      localStorage.removeItem(key);
    });
    console.log(`[Auth] Cleared ${keys.length} MSAL keys. Please refresh the page.`);
  };
}
