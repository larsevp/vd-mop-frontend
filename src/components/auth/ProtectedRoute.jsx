import React from 'react';
import { useUserStore } from '../../stores/store';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  const user = useUserStore((state) => state.user);

  // In AuthSync, we establish that if a user object exists, they are authenticated.
  // If the session becomes invalid later, React Query's global error handler
  // in AuthSync will catch it and render the error page.
  if (!user) {
    // This case would typically happen if someone tries to access a protected route
    // without having gone through the MSAL login flow.
    return <Navigate to="/login" replace />;
  }

  // If user exists, render the nested routes via the Outlet.
  return <Outlet />;
};

export default ProtectedRoute;
