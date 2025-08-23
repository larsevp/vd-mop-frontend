import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";

export default function LogoutButton({ className = "", variant = "default", children, redirectTo }) {
  const { logout } = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout(redirectTo);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Default button styles based on variant
  const getButtonStyles = () => {
    const baseStyles = "btn";

    switch (variant) {
      case "primary":
        return `${baseStyles} btn-error`;
      case "secondary":
        return `${baseStyles} btn-secondary`;
      case "ghost":
        return `${baseStyles} text-text-muted hover:bg-background-muted`;
      default:
        return `${baseStyles} btn-error`;
    }
  };

  return (
    <button onClick={handleLogout} disabled={isLoggingOut} className={`${getButtonStyles()} ${className}`}>
      {isLoggingOut ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Logger ut...</span>
        </>
      ) : (
        <>
          <LogOut size={16} />
          <span>{children || "Logg ut"}</span>
        </>
      )}
    </button>
  );
}
