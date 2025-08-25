import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export const Toast = ({ show, message, type = "info", onClose, persistent = false, centered = false }) => {
  // Auto-close non-persistent toasts after 4 seconds
  useEffect(() => {
    if (show && !persistent) {
      const timer = setTimeout(() => {
        onClose?.();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, persistent, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case "error":
        return <AlertCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" />;
      case "success":
        return <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />;
      case "info":
      default:
        return <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />;
    }
  };

  return (
    <div
      className={cn(
        "fixed z-[100] animate-in slide-in-from-top-2",
        centered ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" : "top-4 right-4"
      )}
    >
      <div
        className={cn(
          "rounded-lg border p-4 shadow-lg backdrop-blur-sm",
          centered ? "min-w-[320px] max-w-md" : "max-w-md",
          type === "error" && "border-destructive/50 bg-white text-destructive",
          type === "success" && "border-green-500/50 bg-white text-green-700",
          type === "info" && "border-primary/50 bg-white text-primary"
        )}
      >
        <div className="flex items-start gap-3">
          {getIcon()}
          <div className="flex-1">
            <p
              className={cn(
                "font-medium",
                centered ? "text-base" : "text-sm",
                type === "error" && "text-destructive",
                type === "success" && "text-green-700",
                type === "info" && "text-primary"
              )}
            >
              {message}
            </p>
          </div>
          {!persistent && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
