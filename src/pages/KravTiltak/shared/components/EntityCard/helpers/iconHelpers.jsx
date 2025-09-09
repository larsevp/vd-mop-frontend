import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Icon mapping and rendering utilities
 */

/**
 * Render an icon component by name
 * @param {string|React.Component} iconName - Name of the icon or React component
 * @param {number} size - Size of the icon
 * @returns {React.Component|null} Icon component or null
 */
export const getIcon = (iconName, size = 12) => {
  // If it's already a React component (from backend), return it directly
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