import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    // Only scroll to top if the pathname actually changed (not just hash)
    // and the hash is not "#" (which is used by pagination)
    // and it's not a workspace route (to preserve scroll position on entity selection)
    const isWorkspaceRoute = pathname.includes('-workspace');
    
    if (prevPathnameRef.current !== pathname && hash !== "#" && !isWorkspaceRoute) {
      window.scrollTo(0, 0);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, hash]);

  return null;
}
