/**
 * Browser detection and Safari-specific utilities for MSAL
 */

export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isSafariOrIOS = () => {
  return isSafari() || isIOS();
};

/**
 * Safari-specific MSAL configuration adjustments
 */
export const getSafariMsalConfig = (baseConfig) => {
  if (!isSafariOrIOS()) {
    return baseConfig;
  }


  return {
    ...baseConfig,
    auth: {
      ...baseConfig.auth,
      // Safari-specific: Ensure proper post-login redirect handling
      navigateToLoginRequestUrl: false,
    },
    cache: {
      ...baseConfig.cache,
      // Safari-specific cache settings - critical for Safari compatibility
      cacheLocation: "localStorage", // Always use localStorage for Safari
      storeAuthStateInCookie: true, // Essential for Safari cross-tab support
      claimsBasedCachingEnabled: true,
      // Safari-specific: Longer cache retention
      cacheExpirationOverride: 86400000, // 24 hours in milliseconds
    },
    system: {
      ...baseConfig.system,
      // Safari-specific timeouts - increased for Safari's slower processing
      windowHashTimeout: 300000, // 5 minutes for Safari
      iframeHashTimeout: 300000,
      tokenRenewalOffsetSeconds: 600, // 10 minutes before expiry
      allowNativeBroker: false, // Critical: Disable for Safari compatibility
      allowRedirectInIframe: true, // Allow iframe redirects for Safari
      // Safari-specific: Disable popup blocking detection
      blockPopups: false,
      // Add Safari-specific logger with more detail
      loggerOptions: {
        ...baseConfig.system.loggerOptions,
        logLevel: 1, // Info level for better debugging
        loggerCallback: (level, message, containsPii) => {
        }
      }
    }
  };
};

/**
 * Safari-specific delay for redirect handling
 */
export const getSafariRedirectDelay = () => {
  return isSafariOrIOS() ? 1500 : 0; // 1.5 second delay for Safari/iOS
};

/**
 * Safari-specific storage cleanup
 */
export const safariStorageCleanup = () => {
  if (!isSafariOrIOS()) {
    return Promise.resolve();
  }


  return new Promise((resolve) => {
    try {
      // Clear all storage types for Safari
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
      
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }

      // Add delay for Safari to process cleanup
      setTimeout(resolve, 500);
    } catch (error) {
      console.error('Safari: Storage cleanup failed:', error);
      resolve();
    }
  });
};

/**
 * Get browser info for debugging
 */
export const getBrowserInfo = () => {
  return {
    userAgent: navigator.userAgent,
    isSafari: isSafari(),
    isIOS: isIOS(),
    isSafariOrIOS: isSafariOrIOS(),
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine
  };
};
