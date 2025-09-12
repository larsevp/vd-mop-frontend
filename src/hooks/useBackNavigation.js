import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect } from "react";

// Simple route parent mapping - industry standard declarative approach
const ROUTE_PARENTS = {
  '/admin-landing': '/',
  '/project-landing': '/prosjekter',
  '/prosjekt-krav-tiltak-flow': '/project-landing',
  '/prosjekt-tiltak-flow': '/project-landing', 
  '/prosjekt-tiltak-flow-workspace': '/project-landing',
  '/krav-workspace': '/admin-landing',
  '/tiltak-workspace': '/admin-landing',
  '/prosjekt-krav-workspace': '/project-landing',
  '/prosjekt-tiltak-workspace': '/project-landing',
  '/enheter': '/admin-landing',
  '/status': '/admin-landing',
  '/vurderinger': '/admin-landing',
  '/kravpakker': '/admin-landing',
  '/kravreferansetyper': '/admin-landing',
  '/lover': '/admin-landing',
  '/krav': '/admin-landing',
  '/tiltak': '/admin-landing',
  '/prosjekt-krav': '/admin-landing',
  '/prosjekt-tiltak': '/admin-landing',
  '/Files': '/admin-landing',
  '/prosjekter': '/',
  '/emner': '/',
};

// Context-aware navigation logic
const getSmartBackTarget = (currentPath) => {
  // Special handling for combined views and flow views based on referrer or URL structure
  if (currentPath === '/prosjekt-krav-tiltak-combined' || currentPath === '/prosjekt-krav-tiltak-flow' || currentPath === '/prosjekt-tiltak-flow') {
    // Check if we can infer context from document.referrer
    const referrer = document.referrer;
    if (referrer) {
      const referrerUrl = new URL(referrer);
      const referrerPath = referrerUrl.pathname;
      
      // If came from a project page, go back there
      if (referrerPath.startsWith('/prosjekt/') || referrerPath === '/project-landing') {
        return referrerPath;
      }
    }
    
    // Default fallback for project combined/flow view
    return '/project-landing';
  }
  
  if (currentPath === '/krav-tiltak-combined') {
    // Check if we can infer context from document.referrer  
    const referrer = document.referrer;
    if (referrer) {
      const referrerUrl = new URL(referrer);
      const referrerPath = referrerUrl.pathname;
      
      // If came from admin area, go back there
      if (referrerPath === '/admin-landing' || ROUTE_PARENTS[referrerPath] === '/admin-landing') {
        return referrerPath;
      }
    }
    
    // Default fallback for admin combined view
    return '/admin-landing';
  }

  // Handle edit routes: /:model/:id/rediger -> /:model
  if (currentPath.includes('/rediger')) {
    const parts = currentPath.split('/');
    if (parts.length >= 3) {
      return `/${parts[1]}`;
    }
  }
  
  // Handle new routes: /:model/ny -> /:model
  if (currentPath.includes('/ny')) {
    const parts = currentPath.split('/');
    if (parts.length >= 2) {
      return `/${parts[1]}`;
    }
  }
  
  // Handle project detail routes: /prosjekt/:id -> /prosjekter
  if (currentPath.match(/^\/prosjekt\/\d+$/)) {
    return '/prosjekter';
  }
  
  // Handle entity routes with IDs: /some-path/:id -> /some-path
  const withoutId = currentPath.replace(/\/\d+$/, '');
  if (withoutId !== currentPath && ROUTE_PARENTS[withoutId]) {
    return ROUTE_PARENTS[withoutId];
  }
  
  // Direct mapping
  return ROUTE_PARENTS[currentPath] || '/';
};

/**
 * Industry-standard navigation hook with context awareness
 * Simple, predictable, and maintainable
 */
export const useBackNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const goBack = useCallback(() => {
    const returnTo = location.state?.returnTo;
    
    // Explicit returnTo takes precedence
    if (returnTo) {
      navigate(returnTo, { replace: true });
      return;
    }

    // Try browser back first, but with validation
    if (window.history.length > 1) {
      try {
        navigate(-1);
        return;
      } catch (error) {
        console.warn('Browser back failed, using smart navigation:', error);
      }
    }

    // Fallback to smart navigation
    const target = getSmartBackTarget(currentPath);
    navigate(target);
  }, [navigate, location, currentPath]);

  const shouldShowBackButton = () => {
    // Show back button if we're not on the home page
    return location.pathname !== '/';
  };

  return { goBack, shouldShowBackButton };
};