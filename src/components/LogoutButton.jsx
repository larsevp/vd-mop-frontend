import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { useLogout } from '../hooks/useLogout';

export default function LogoutButton({ className = '', variant = 'default', children, redirectTo }) {
  const { logout } = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout(redirectTo);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Default button styles based on variant
  const getButtonStyles = () => {
    const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    switch (variant) {
      case 'primary':
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700`;
      case 'secondary':
        return `${baseStyles} bg-gray-100 text-gray-700 hover:bg-gray-200`;
      case 'ghost':
        return `${baseStyles} text-gray-600 hover:bg-gray-100`;
      default:
        return `${baseStyles} bg-red-600 text-white hover:bg-red-700`;
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={`${getButtonStyles()} ${className}`}
    >
      {isLoggingOut ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          <span>Logger ut...</span>
        </>
      ) : (
        <>
          <LogOut size={16} />
          <span>{children || 'Logg ut'}</span>
        </>
      )}
    </button>
  );
}
