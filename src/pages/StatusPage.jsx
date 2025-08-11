import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest, signupRequest } from '../msalConfig';
import { AlertCircle, LogIn, AlertTriangle } from 'lucide-react';
import { useLogout } from '../hooks/useLogout';
import { useUserStore } from '../stores/userStore';
import { getReturnUrl } from '../utils/msalUtils';
import { handleLogin, handleSignup, handleLogout } from '../utils/authFlows';
import { getStatusPageContent, shouldShowSignupButton, shouldShowReloadButton } from '../utils/statusPageUtils';

/**
 * Unified status page component that handles:
 * - Login (SSO)
 * - Login errors
 * - Authentication sync errors
 * - General error states
 */
export default function StatusPage({ 
  type = 'login', // 'login', 'error', 'sync-error'
  error = null,
  title = null,
  description = null,
  showLoginButton = true,
  showLogoutButton = false,
  showRefreshButton = false,
  showBackButton = false
}) {
  console.log('StatusPage: Rendering with props:', { type, error, title, description, showLoginButton, showLogoutButton, showRefreshButton, showBackButton });
 
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useLogout();
  const { user } = useUserStore(); // Add user from store
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Error handling
  useEffect(() => {
    if (error) { setLoginError(error); return; }
    const urlParams = new URLSearchParams(location.search);
    const urlError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    if (urlError) setLoginError(errorDescription || 'Innlogging mislyktes. Vennligst prøv igjen.');
  }, [error, location]);

  // Auto-redirect if already authenticated (for login type)
  useEffect(() => {
    const isAuthenticated = accounts && accounts.length > 0;
    if (type === 'login' && isAuthenticated) {
      const returnUrl = getReturnUrl(location);
      navigate(returnUrl, { replace: true });
    }
  }, [accounts, user, navigate, type, location]);

  const onLogin = () => handleLogin({
    instance,
    loginRequest,
    location,
    navigate,
    setIsLoggingIn,
    setLoginError,
    isLoggingIn,
    isSigningUp,
    inProgress
  });

  const onSignup = () => handleSignup({
    instance,
    signupRequest,
    location,
    setIsSigningUp,
    setLoginError,
    isSigningUp,
    isLoggingIn,
    inProgress
  });

  const onLogout = () => handleLogout({ logout, setIsLoggingOut });

  const content = getStatusPageContent({ type, title, description, loginError, error });
  const hasError = loginError || error;
  const loginDisabled = isLoggingIn || isSigningUp || inProgress !== 'none';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">MOP</h1>
          <p className="text-neutral-600">Miljø og Prosjekthåndteringssystem</p>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 ${content.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {content.iconType === 'AlertTriangle' ? <AlertTriangle className="w-8 h-8 text-red-600" /> : content.iconType === 'LogIn' && !hasError ? <LogIn className="w-8 h-8 text-blue-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
              {content.title}
            </h2>
            <p className="text-neutral-600">
              {content.description}
            </p>
          </div>

          {/* Error Message */}
          {hasError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-grow">
                <h3 className="text-sm font-medium text-red-800">
                  {type === 'login' ? 'Innloggingsfeil' : 'Feil'}
                </h3>
                <p className="text-sm text-red-700 mt-1">{hasError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {showLoginButton && !showLogoutButton && (
              <>
                <button
                  onClick={onLogin}
                  disabled={loginDisabled}
                  className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Logger inn...</span>
                    </>
                  ) : (
                    <>
                      <LogIn size={20} />
                      <span>Logg inn med Microsoft</span>
                    </>
                  )}
                </button>
                {showLoginButton && shouldShowSignupButton(loginError, type) && (
                  <button
                    onClick={onSignup}
                    disabled={isSigningUp || isLoggingIn || inProgress !== 'none'}
                    className="w-full bg-green-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSigningUp ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Oppretter konto...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={20} />
                        <span>Opprett ny konto</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}

            {showLogoutButton && (
              <button
                onClick={onLogout}
                disabled={isLoggingOut}
                className="w-full bg-neutral-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-neutral-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Logger ut...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Logg ut</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
