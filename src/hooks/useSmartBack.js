import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";

/**
 * Smart back navigation hook that checks browser history first,
 * then falls back to context-aware navigation
 */
export const useSmartBack = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasHistory, setHasHistory] = useState(false);

  // Track if we have navigational history within the app
  useEffect(() => {
    // Check if we have history by looking at window.history.length
    // and if we came from within the app (not direct URL entry)
    const hasInternalHistory =
      window.history.length > 1 && (document.referrer === "" || document.referrer.includes(window.location.origin));
    setHasHistory(hasInternalHistory);
  }, [location.pathname]);

  const goBack = useCallback(() => {
    const currentPath = location.pathname;

    // First, try browser history if we have internal app history
    if (hasHistory) {
      try {
        navigate(-1);
        return;
      } catch (error) {
        // If navigate(-1) fails, fall through to intelligent navigation
        console.warn("Browser back navigation failed, using smart navigation");
      }
    }

    // Smart navigation fallbacks based on context

    // Admin user routes - go to admin landing (for user management)
    if (currentPath.includes("/admin/")) {
      navigate("/admin-landing");
      return;
    }

    // Model edit/new routes - go to model list
    if (currentPath.includes("/rediger") || currentPath.includes("/ny")) {
      // Extract the base model path
      const pathParts = currentPath.split("/");
      if (pathParts.length >= 2) {
        const modelPath = "/" + pathParts[1]; // e.g., /prosjekter, /enheter, etc.
        navigate(modelPath);
        return;
      }
    }

    // Project-specific routes
    if (currentPath.includes("/prosjekt/")) {
      // If we're in a specific project, go to projects list
      navigate("/prosjekter");
      return;
    }

    // Model administration routes - intelligent context-aware routing
    if (currentPath === "/prosjekter") {
      // Projects admin should go to home (landing page) since users access it from there
      navigate("/");
      return;
    }

    if (currentPath === "/emner") {
      // Topics/subjects admin should go to home (landing page)
      navigate("/");
      return;
    }

    // Other admin model routes - go to admin landing
    const adminRoutes = [
      "/enheter",
      "/status",
      "/vurderinger",
      "/kravpakker",
      "/kravreferansetyper",
      "/lover",
      "/krav",
      "/tiltak",
      "/prosjekt-krav",
      "/prosjekt-tiltak",
    ];

    if (adminRoutes.includes(currentPath)) {
      navigate("/admin-landing");
      return;
    }

    // Tiltak routes - go to appropriate tiltak page
    if (currentPath.includes("/tiltak")) {
      navigate("/"); // Or specific tiltak landing if it exists
      return;
    }

    // Default fallback - go to home
    navigate("/");
  }, [navigate, location.pathname, hasHistory]);

  return { goBack };
};

/**
 * Get the appropriate back route for a given path
 * Useful for direct navigation without the hook
 */
export const getBackRoute = (currentPath) => {
  // Admin routes
  if (currentPath.includes("/admin/")) {
    return "/admin-landing";
  }

  // Model edit/new routes
  if (currentPath.includes("/rediger") || currentPath.includes("/ny")) {
    const pathParts = currentPath.split("/");
    if (pathParts.length >= 2) {
      return "/" + pathParts[1];
    }
  }

  // Project-specific routes
  if (currentPath.includes("/prosjekt/")) {
    return "/prosjekter";
  }

  // Context-aware admin model routes
  if (currentPath === "/prosjekter" || currentPath === "/emner") {
    return "/"; // Go to landing page
  }

  // Other admin model routes
  const adminRoutes = [
    "/enheter",
    "/status",
    "/vurderinger",
    "/kravpakker",
    "/kravreferansetyper",
    "/lover",
    "/krav",
    "/tiltak",
    "/prosjekt-krav",
    "/prosjekt-tiltak",
  ];

  if (adminRoutes.includes(currentPath)) {
    return "/admin-landing";
  }

  // Default
  return "/";
};
