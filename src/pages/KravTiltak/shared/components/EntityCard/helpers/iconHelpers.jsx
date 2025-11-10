import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Icon mapping and rendering utilities
 */

/**
 * Render an icon component by name or component function
 * @param {string|React.Component|Function} iconName - Name of the icon, React component, or component function
 * @param {number} size - Size of the icon
 * @returns {React.Component|null} Icon component or null
 */
export const getIcon = (iconName, size = 12) => {
  // If it's a React component function (like Triangle from lucide-react)
  if (typeof iconName === 'function') {
    const IconComponent = iconName;
    return <IconComponent size={size} />;
  }

  // If it's already a React element
  if (React.isValidElement(iconName)) {
    return React.cloneElement(iconName, { size });
  }

  // If it's a string, look it up in lucide-react icons
  if (typeof iconName === 'string') {
    const IconComponent = LucideIcons[iconName];
    return IconComponent ? <IconComponent size={size} /> : null;
  }

  return null;
};