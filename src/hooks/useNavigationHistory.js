import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigationHistoryStore } from "@/stores/navigationHistoryStore";

// Hook to record internal navigation paths into a simple stack
export const useNavigationHistory = () => {
  const location = useLocation();
  const push = useNavigationHistoryStore((s) => s.push);

  useEffect(() => {
    // Only track internal app routes
    push(location.pathname + location.search);
  }, [location.pathname, location.search, push]);
};

export default useNavigationHistory;
