import { QueryClient } from '@tanstack/react-query';

// Global auth error handler - will be set by AuthSync component
let globalAuthErrorHandler = null;

export const setGlobalAuthErrorHandler = (handler) => {
  globalAuthErrorHandler = handler;
  // Also expose it globally for debugging
  window.__globalAuthErrorHandler = handler;
};

export const getGlobalAuthErrorHandler = () => {
  return globalAuthErrorHandler;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      //cacheTime: 30 * 60 * 1000, // 30 minutes in milliseconds
      cacheTime: 0.5 * 1000, // 0.5 seconds in milliseconds
      staleTime: 5 * 60 * 1000,   // 5 minutes in milliseconds
      retry: (failureCount, error) => {
        // Don't retry 401 errors - fail immediately
        if (error?.response?.status === 401) {
          return false;
        }
        // Default retry logic for other errors (max 3 retries)
        return failureCount < 3;
      },
      onError: (error) => {
        if (error?.response?.status === 401 && globalAuthErrorHandler) {
          globalAuthErrorHandler(error);
        }
      }
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry 401 errors - fail immediately
        if (error?.response?.status === 401) {
          return false;
        }
        // Default retry logic for other errors (max 3 retries)
        return failureCount < 3;
      },
      onError: (error) => {
        if (error?.response?.status === 401 && globalAuthErrorHandler) {
          globalAuthErrorHandler(error);
        }
      }
    }
  }
});
