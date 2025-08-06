/**
 * Utility functions for debugging MSAL token issues
 */

export function debugTokenInfo(instance, accounts) {
  if (!accounts || accounts.length === 0) {
    console.log('No accounts found');
    return;
  }

  const account = accounts[0];
  console.log('=== TOKEN DEBUG INFO ===');
  console.log('Account:', {
    username: account.username,
    tenantId: account.tenantId,
    homeAccountId: account.homeAccountId,
    environment: account.environment,
  });

  // Check for cached tokens
  const tokenCache = instance.getTokenCache();
  const accessToken = tokenCache.getAccessTokenCredential(account.homeAccountId);
  const refreshToken = tokenCache.getRefreshTokenCredential(account.homeAccountId);

  if (accessToken) {
    const expiresOn = new Date(accessToken.expiresOn * 1000);
    const now = new Date();
    const timeUntilExpiry = expiresOn - now;
    
    console.log('Access Token:', {
      expiresOn: expiresOn.toISOString(),
      timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`,
      isExpired: timeUntilExpiry <= 0,
    });
  } else {
    console.log('No access token found in cache');
  }

  if (refreshToken) {
    console.log('Refresh Token: Present');
  } else {
    console.log('Refresh Token: Missing');
  }

  console.log('========================');
}

export function checkConditionalAccess(error) {
  if (error?.errorCode === 'interaction_required' || 
      error?.errorCode === 'consent_required' ||
      error?.errorCode === 'claims_challenge_required') {
    console.warn('Conditional Access or additional authentication required:', error);
    return true;
  }
  return false;
}
