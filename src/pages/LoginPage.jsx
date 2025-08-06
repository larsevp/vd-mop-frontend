import React, { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from '../msalConfig';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, LogIn, Home } from 'lucide-react';

export default function LoginPage() {
  const { instance, accounts } = useMsal();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    if (accounts.length > 0) {
      // User is already authenticated, redirect to intended page or home
      const returnUrl = getReturnUrl();
      navigate(returnUrl, { replace: true });
    }
  }, [accounts, navigate]);

  // Get return URL from Microsoft SSO state or default to home
  const getReturnUrl = () => {
    try {
      // Check if there's a state parameter from Microsoft redirect
      const urlParams = new URLSearchParams(location.search);
      const state = urlParams.get('state');
      if (state) {
        const parsedState = JSON.parse(state);
        return parsedState.returnUrl || '/';
      }
    } catch (error) {
      console.warn('Could not parse state parameter:', error);
    }
    return '/';
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      await instance.loginRedirect(loginRequest);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Det oppstod en feil under innlogging. Vennligst prøv igjen.');
      setIsLoggingIn(false);
    }
  };

  const handleBackToApp = () => {
    navigate('/');
  };

  // Handle login errors from URL parameters (from Microsoft redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    if (error) {
      setLoginError(errorDescription || 'Innlogging mislyktes. Vennligst prøv igjen.');
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">MOP</h1>
          <p className="text-neutral-600">Miljø og Prosjekthåndteringssystem</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
              {loginError ? 'Innloggingsfeil' : 'Logg inn'}
            </h2>
            <p className="text-neutral-600">
              {loginError 
                ? 'Det oppstod et problem under innlogging' 
                : 'Bruk din Microsoft-konto for å fortsette'
              }
            </p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Innloggingsfeil</h3>
                <p className="text-sm text-red-700 mt-1">{loginError}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
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

            {loginError && (
              <button
                onClick={handleBackToApp}
                className="w-full bg-neutral-100 text-neutral-700 rounded-lg px-6 py-3 font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
              >
                <Home size={20} />
                <span>Tilbake til forsiden</span>
              </button>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              Ved å logge inn godtar du våre{' '}
              <a href="#" className="text-blue-600 hover:text-blue-700">
                vilkår for bruk
              </a>
            </p>
          </div>
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
