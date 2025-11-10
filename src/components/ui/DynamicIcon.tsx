import React from "react";
import * as Icons from "lucide-react";

// Type for available Lucide icon names
type LucideIconName = keyof typeof Icons;

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

/**
 * Dynamic icon component that renders Lucide icons by name
 * @param name - The name of the Lucide icon (e.g., "CheckCircle", "AlertTriangle")
 * @param className - CSS classes to apply
 * @param size - Icon size in pixels (default: 16)
 * @param color - Hex color for the icon (e.g., "#22c55e")
 */
export function DynamicIcon({ name, className = "", size = 16, color }: IconProps) {
  // Get the icon component from Lucide React
  const IconComponent = Icons[name as LucideIconName] as React.ComponentType<any>;

  // Apply color as inline style if provided
  const style = color ? { color } : undefined;

  // Fallback to a default icon if the specified icon doesn't exist
  if (!IconComponent) {
    const FallbackIcon = Icons.Circle;
    return <FallbackIcon size={size} className={className} style={style} />;
  }

  return <IconComponent size={size} className={className} style={style} />;
}

/**
 * Utility function to render icon with text
 * @param iconName - Lucide icon name, React component function, or React element
 * @param text - Text to display next to icon
 * @param className - CSS classes for the container
 * @param iconSize - Size of the icon
 * @param iconColor - Hex color for the icon
 * @param iconClassName - CSS classes for the icon
 */
export function IconWithText({
  iconName,
  text,
  className = "",
  iconSize = 16,
  iconClassName = "mr-2",
  iconColor,
  iconRotation = "",
}: {
  iconName?: string | React.ComponentType<any> | React.ReactElement;
  text: string;
  className?: string;
  iconSize?: number;
  iconClassName?: string;
  iconColor?: string;
  iconRotation?: string;
}) {
  // Handle empty/null/undefined
  if (!iconName) {
    return <span className={className}>{text}</span>;
  }

  // Combine iconClassName with iconRotation
  const combinedIconClassName = `${iconClassName} ${iconRotation}`.trim();

  // Handle React component function (like Triangle)
  if (typeof iconName === 'function') {
    const IconComponent = iconName;
    return (
      <span className={`flex items-center ${className}`}>
        <IconComponent size={iconSize} className={combinedIconClassName} style={iconColor ? { color: iconColor } : undefined} />
        {text}
      </span>
    );
  }

  // Handle React element
  if (React.isValidElement(iconName)) {
    return (
      <span className={`flex items-center ${className}`}>
        {React.cloneElement(iconName, { size: iconSize, className: combinedIconClassName })}
        {text}
      </span>
    );
  }

  // Handle string icon name
  if (typeof iconName === 'string' && iconName.trim() !== "") {
    return (
      <span className={`flex items-center ${className}`}>
        <DynamicIcon name={iconName} size={iconSize} className={combinedIconClassName} color={iconColor} />
        {text}
      </span>
    );
  }

  // Fallback for empty strings
  return <span className={className}>{text}</span>;
}

export default DynamicIcon;
