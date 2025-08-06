import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../msalConfig';
import { AlertCircle, LogIn, Home, RefreshCcw, AlertTriangle, LogOut } from 'lucide-react';
import LogoutButton from '../components/LogoutButton';
import { useLogout } from '../hooks/useLogout';
import { useUserStore } from '../stores/userStore';

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
  
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useLogout();
  const { user } = useUserStore(); // Add user from store
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  console.log('StatusPage: MSAL state - accounts:', accounts, 'instance:', instance ? 'present' : 'missing');
  console.log('StatusPage: Manual user state:', user);

  // Auto-detect login errors from URL or props
  useEffect(() => {
    console.log('StatusPage: Checking for errors - error prop:', error);
    if (error) {
      setLoginError(error);
      return;
    }

    // Handle login errors from URL parameters (from Microsoft redirect)
    const urlParams = new URLSearchParams(location.search);
    const urlError = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    console.log('StatusPage: URL error check - urlError:', urlError, 'errorDescription:', errorDescription);
    
    if (urlError) {
      setLoginError(errorDescription || 'Innlogging mislyktes. Vennligst prøv igjen.');
    }
  }, [error, location]);

  // Auto-redirect if already authenticated (for login type)
  useEffect(() => {
    console.log('StatusPage: Checking auto-redirect - type:', type, 'accounts.length:', accounts.length, 'manual user:', user);
    
    // Check for both MSAL and manual authentication
    const isMsalAuthenticated = accounts.length > 0;
    const isManualAuthenticated = user && user.isManualLogin;
    
    if (type === 'login' && (isMsalAuthenticated || isManualAuthenticated)) {
      const returnUrl = getReturnUrl();
      console.log('StatusPage: Auto-redirecting authenticated user to:', returnUrl);
      navigate(returnUrl, { replace: true });
    }
  }, [accounts, user, navigate, type]);

  const getReturnUrl = () => {
    try {
      const urlParams = new URLSearchParams(location.search);
      const state = urlParams.get('state');
      console.log('StatusPage: getReturnUrl - URL params:', location.search, 'state:', state);
      if (state) {
        const parsedState = JSON.parse(state);
        console.log('StatusPage: getReturnUrl - parsed state:', parsedState);
        return parsedState.returnUrl || '/';
      }
    } catch (error) {
      console.error('StatusPage: getReturnUrl - could not parse state parameter:', error);
    }
    console.log('StatusPage: getReturnUrl - returning default "/"');
    return '/';
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      // Store the intended destination for after login
      const returnUrl = getReturnUrl();
      
      await instance.loginRedirect({
        ...loginRequest,
        state: JSON.stringify({ returnUrl })
      });
    } catch (error) {
      setLoginError('Det oppstod en feil under innlogging. Vennligst prøv igjen.');
      setIsLoggingIn(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout('/login');
      // Force a full page reload to ensure all state is cleared
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback - force reload to login page even if logout fails
      window.location.href = '/login';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleBackToApp = () => {
    navigate('/');
  };

  // Dynamic content based on type
  const getContent = () => {
    const hasError = loginError || error;

    switch (type) {
      case 'error':
      case 'sync-error':
        return {
          title: title || 'Synkroniseringsfeil',
          description: description || 'Det oppstod et problem under synkronisering av brukerdata',
          icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
          iconBg: 'bg-red-100'
        };
      
      case 'login':
      default:
        return {
          title: title || (hasError ? 'Innloggingsfeil' : 'Logg inn'),
          description: description || (hasError 
            ? 'Det oppstod et problem under innlogging' 
            : 'Bruk din Microsoft-konto for å fortsette'
          ),
          icon: hasError ? <AlertCircle className="w-8 h-8 text-red-600" /> : <LogIn className="w-8 h-8 text-blue-600" />,
          iconBg: hasError ? 'bg-red-100' : 'bg-blue-100'
        };
    }
  };

  const content = getContent();
  const hasError = loginError || error;

  console.log('StatusPage: Render state - isLoggingIn:', isLoggingIn, 'loginError:', loginError, 'hasError:', hasError, 'content:', content);

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
              {content.icon}
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
              <div>
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
              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            )}

            {showRefreshButton && (
              <button 
                onClick={handleRefresh}
                className="w-full bg-blue-600 text-white rounded-lg px-6 py-3 font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw size={20} />
                <span>Prøv igjen</span>
              </button>
            )}

            {showLogoutButton && (
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full bg-gray-100 text-gray-700 rounded-lg px-6 py-3 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                    <span>Logger ut...</span>
                  </>
                ) : (
                  <>
                    <LogOut size={20} />
                    <span>Logg ut og start på nytt</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Login-specific footer */}
          {type === 'login' && !hasError && (
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-500">
                Ved å logge inn godtar du våre{' '}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  vilkår for bruk
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 mb-2">Trenger du hjelp?</p>
          <a 
            href="#" 
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Kontakt systemadministrator
          </a>
        </div>
      </div>
    </div>
  );
}
