import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Industry standard: scroll to top on route navigation
    // Only skip scrolling if:
    // 1. Hash navigation (same page, different section)
    // 2. Same pathname (hash-only changes)
    
    const pathnameChanged = prevPathnameRef.current !== pathname;
    const isHashNavigation = hash && hash !== "#";
    
    if (pathnameChanged && !isHashNavigation) {
      // Industry standard: instant scroll to top on route change
      window.scrollTo(0, 0);
    }
    
    prevPathnameRef.current = pathname;
  }, [pathname, hash]);

  return null;
}
