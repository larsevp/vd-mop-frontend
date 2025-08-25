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

  // Enhanced button styles based on variant
  const getButtonStyles = () => {
    const baseStyles =
      "inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    switch (variant) {
      case "primary":
        return `${baseStyles} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md`;
      case "secondary":
        return `${baseStyles} bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 focus:ring-gray-500`;
      case "ghost":
        return `${baseStyles} text-gray-600 hover:text-red-600 hover:bg-red-50 focus:ring-red-500 rounded-lg`;
      case "outline":
        return `${baseStyles} border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 focus:ring-red-500`;
      default:
        return `${baseStyles} bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md`;
    }
  };

  return (
    <button onClick={handleLogout} disabled={isLoggingOut} className={`${getButtonStyles()} ${className}`} title="Logg ut av systemet">
      {isLoggingOut ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Logger ut...</span>
        </>
      ) : (
        <>
          <LogOut size={16} className="flex-shrink-0" />
          <span className="text-sm">{children || "Logg ut"}</span>
        </>
      )}
    </button>
  );
}
