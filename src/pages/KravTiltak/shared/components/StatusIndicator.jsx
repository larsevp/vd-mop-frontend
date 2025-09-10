import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Generic StatusIndicator component for displaying status, vurdering, prioritet
 * Used across KravTiltak domain entities
 */
const StatusIndicator = ({ display, iconOnly = false, size = 12 }) => {
  if (!display) return null;
  
  // Get icon component - support all lucide icons
  const getIcon = (iconName) => {
    if (React.isValidElement(iconName)) {
      return React.cloneElement(iconName, { size });
    }
    if (typeof iconName === 'string') {
      const IconComponent = LucideIcons[iconName];
      return IconComponent ? <IconComponent size={size} /> : null;
    }
    return null;
  };

  const iconElement = display.icon ? getIcon(display.icon) : null;
  
  if (iconOnly) {
    return (
      <div 
        className="flex-shrink-0"
        style={{ color: display.color }}
        title={display.text}
      >
        {iconElement}
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-1">
      {iconElement && (
        <div style={{ color: display.color }}>
          {iconElement}
        </div>
      )}
      <span className="text-xs">
        {display.text}
      </span>
    </div>
  );
};

export default StatusIndicator;