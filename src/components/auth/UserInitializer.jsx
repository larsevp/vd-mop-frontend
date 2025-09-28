import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/stores/userStore";
import { LoadingSpinner } from "@/components/ui";

/**
 * Industry standard authentication guard component
 * Ensures user is properly validated before allowing access
 */
export default function UserInitializer({ children }) {
  const userStore = useUserStore();
  const { user, fetchUserInfo, isLoadingUserInfo, userInfoError } = userStore;
  const [hasFetched, setHasFetched] = useState(false);
  const fetchAttempted = useRef(false);
  const errorRetryCount = useRef(0);
  const maxRetries = 3;


  // Single effect to handle validation logic
  useEffect(() => {
    // No user - allow through
    if (!user) {
      setHasFetched(true);
      return;
    }

    // User already validated - allow through
    const isValidated = (!user.isManualLogin && user.rolle) || (user.isManualLogin && user.enhetId);

    if (isValidated) {
      setHasFetched(true);
      return;
    }

    // Circuit breaker: Stop retrying after max attempts
    if (userInfoError && errorRetryCount.current >= maxRetries) {
      setHasFetched(true);
      return;
    }

    // Need validation and haven't tried yet (or retrying after error)
    if (!fetchAttempted.current && !isLoadingUserInfo) {
      fetchAttempted.current = true;
      fetchUserInfo();
      return;
    }

    // Validation completed (success or error)
    if (fetchAttempted.current && !isLoadingUserInfo) {
      if (userInfoError) {
        errorRetryCount.current += 1;

        if (errorRetryCount.current < maxRetries) {
          // Reset fetch flag to allow retry
          fetchAttempted.current = false;
          return;
        }
      }

      setHasFetched(true);
    }
  }, [user, isLoadingUserInfo, userInfoError, fetchUserInfo]);

  // Show loading while fetching or not ready
  if (!hasFetched || isLoadingUserInfo) {
    return <LoadingSpinner text="Laster bruker..." />;
  }

  // Show loading on validation error (let redirect happen)
  if (userInfoError) {
    return <LoadingSpinner text="Laster bruker..." />;
  }

  // Block unauthorized users after validation
  if (user && !user.isManualLogin && !user.rolle) {
    return <LoadingSpinner text="Laster bruker..." />;
  }

  if (user && user.isManualLogin && !user.enhetId) {
    return <LoadingSpinner text="Laster bruker..." />;
  }

  return children;
}
