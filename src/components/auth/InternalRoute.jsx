import React from "react";
import { useUserStore } from "@/stores/userStore";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Route guard that blocks external users.
 * External users are redirected to the landing page,
 * which shows only their assigned projects.
 */
const InternalRoute = () => {
  const { user } = useUserStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.userType === "ekstern") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default InternalRoute;
