import React from "react";
import { useUserStore } from "@/stores/userStore";
import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = () => {
  const { user } = useUserStore();

  // First check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Then check if user has admin role
  if (user.rolle !== "ADMIN") {
    // Redirect non-admin users to the main landing page with a message
    return <Navigate to="/" replace />;
  }

  // If user exists and is admin, render the nested routes via the Outlet
  return <Outlet />;
};

export default AdminRoute;
