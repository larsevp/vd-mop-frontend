import React from "react";

interface CardWrapperProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A reusable card wrapper component based on the "Quick Access Card" design.
 * This wrapper does not include a background color by default.
 */
const CardWrapper = ({ children, className = "" }: CardWrapperProps) => {
  return (
    <div
      className={`rounded-xl border border-neutral-200 p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

export { CardWrapper };
