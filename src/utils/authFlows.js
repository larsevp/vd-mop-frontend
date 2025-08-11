/**
 * Authentication flow handlers for StatusPage
 */
import { 
  getReturnUrl,
} from './msalUtils';

/**
 * Minimal login (doc-aligned): only gate on inProgress === 'none' and local isLogging flags
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
  inProgress
}) => {
  if (isLoggingIn || isSigningUp) return;
  if (inProgress !== 'none') return;
  setIsLoggingIn(true); setLoginError(null);
  try {
    const activeAccount = instance.getActiveAccount();
    const allAccounts = instance.getAllAccounts();
    if (activeAccount || allAccounts.length > 0) {
      //console.log("GETTING activeAccount, and redirecting ",location)
      const returnUrl = getReturnUrl(location);
      navigate(returnUrl, { replace: true });
      return;
    }
    const returnUrl = getReturnUrl(location);
    await instance.loginRedirect({ ...loginRequest, state: JSON.stringify({ returnUrl, ts: Date.now(), mode: 'login' }) });
  } catch (error) {
    // Simple handling: just log and ignore interaction_in_progress completely
    if (error.errorCode === 'interaction_in_progress') {
      console.log('interaction_in_progress - flow already running, ignoring');
      return;
    }
    console.error('Login failed:', error);
    setLoginError('Login failed. Please try again.');
    setIsLoggingIn(false);
  }
};

export const handleSignup = async ({
  instance,
  signupRequest,
  location,
  setIsSigningUp,
  setLoginError,
  isSigningUp,
  isLoggingIn,
  inProgress
}) => {
  if (isSigningUp || isLoggingIn) return;
  if (inProgress !== 'none') return;
  setIsSigningUp(true); setLoginError(null);
  try {
    const returnUrl = getReturnUrl(location);
    await instance.loginRedirect({ ...signupRequest, state: JSON.stringify({ returnUrl, ts: Date.now(), mode: 'signup' }) });
  } catch (error) {
    if (error.errorCode === 'interaction_in_progress') {
      console.log('interaction_in_progress during signup - ignoring');
      return;
    }
    console.error('Signup failed:', error);
    setLoginError('Signup failed. Please try again.');
    setIsSigningUp(false);
  }
};

export const handleLogout = async ({ logout, setIsLoggingOut }) => {
  setIsLoggingOut(true);
  try {
    await logout('/login');
  } catch (e) {
    console.error('Logout failed, forcing redirect', e);
    window.location.href = '/login';
  } finally { setIsLoggingOut(false); }
};
