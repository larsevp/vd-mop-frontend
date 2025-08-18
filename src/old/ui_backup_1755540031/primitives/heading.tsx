import React from "react";

interface HeadingProps {
  /**
   * The heading level (1-6). Defaults to 1 (h1).
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * The content of the heading.
   */
  children: React.ReactNode;
  /**
   * Additional CSS classes for styling.
   */
  className?: string;
}

/**
 * A reusable Heading component that renders a semantic heading tag (h1-h6).
 * Includes default styles for each heading level and supports responsive sizes.
 */
const Heading = ({ level = 1, children, className = "" }: HeadingProps) => {
  const Tag: React.ElementType = `h${level}`;

  // Default styles for each heading level
  const levelStyles = {
    1: "text-4xl md:text-5xl lg:text-6xl font-bold", // Largest and bold
    2: "text-3xl md:text-4xl lg:text-5xl font-semibold", // Slightly smaller
    3: "text-2xl md:text-3xl lg:text-4xl font-semibold", // Medium size
    4: "text-xl md:text-2xl lg:text-3xl font-medium", // Smaller
    5: "text-lg md:text-xl lg:text-2xl font-medium", // Slightly larger than h6
    6: "text-xs md:text-sm lg:text-base font-bold", // Smallest and bold
  };

  return (
    <Tag className={`${levelStyles[level]} text-neutral-900 ${className}`}>
      {children}
    </Tag>
  );
};

export { Heading };
