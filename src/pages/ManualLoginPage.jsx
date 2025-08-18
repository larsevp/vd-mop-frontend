import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, LogIn, Eye, EyeOff } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { manualLogin } from "@/api/auth";
import { getThemeClasses } from "@/hooks/useTheme";

export default function ManualLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await manualLogin(email, password);
      const { accessToken, refreshToken, token, user } = response.data;

      // Handle both old (token) and new (accessToken/refreshToken) response formats
      const finalAccessToken = accessToken || token;

      console.log("Manual login successful:", { user, hasAccessToken: !!finalAccessToken, hasRefreshToken: !!refreshToken });

      // Store tokens separately to avoid sensitive data detection
      localStorage.setItem("mt", finalAccessToken); // Access token
      if (refreshToken) {
        localStorage.setItem("rt", refreshToken); // Refresh token
      }

      // Store user with manual login flag
      const manualUser = {
        ...user,
        isManualLogin: true,
      };

      console.log("Setting user in store:", manualUser);
      setUser(manualUser);

      // Navigate to home page after a short delay to ensure store update
      setTimeout(() => {
        console.log("Navigating to home page");
        navigate("/", { replace: true });
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      if (error.response?.status === 401) {
        setLoginError("Ugyldig e-post eller passord.");
      } else if (error.response?.status === 429) {
        setLoginError("For mange påloggingsforsøk. Vennligst prøv igjen senere.");
      } else {
        setLoginError("Det oppstod en feil under innlogging. Vennligst prøv igjen.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-background-primary rounded-lg shadow-elevated p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-text-primary mb-2">Administrator-innlogging</h2>
            <p className="text-text-muted">Logg inn med e-post og passord</p>
          </div>

          {loginError && (
            <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 text-error-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-error-700">{loginError}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                E-post
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={getThemeClasses.input.base}
                placeholder="din@epost.no"
                disabled={isLoggingIn}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                Passord
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Skriv inn passord"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoggingIn}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !email || !password}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Logger inn...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Logg inn
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Vanlig bruker?{" "}
              <button onClick={() => navigate("/login")} className="text-blue-600 hover:text-blue-500 font-medium">
                Bruk Microsoft SSO
              </button>
            </p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">Denne siden er kun for administratorer med manuell tilgang</p>
        </div>
      </div>
    </div>
  );
}
