import React from 'react';
import * as LucideIcons from 'lucide-react';

/**
 * Generic StatusIndicator component for displaying status, vurdering, prioritet
 * Used across KravTiltak domain entities
 */
const StatusIndicator = ({ display, iconOnly = false, size = 12 }) => {
  if (!display) return null;

  // Get icon component - support all lucide icons and React components
  const getIcon = (iconName) => {
    // Check if it's a React component function (like Triangle)
    if (typeof iconName === 'function') {
      const IconComponent = iconName;
      return <IconComponent size={size} />;
    }
    // Check if it's already a React element
    if (React.isValidElement(iconName)) {
      return React.cloneElement(iconName, { size });
    }
    // Check if it's a string name for Lucide icons
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
        className={`flex-shrink-0 ${display.iconRotation || ''}`}
        style={{ color: display.color }}
        title={display.text}
      >
        {iconElement}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {iconElement && (
        <div className={`select-none ${display.iconRotation || ''}`} style={{ color: display.color }}>
          {iconElement}
        </div>
      )}
      <span className="text-xs text-slate-900">
        {display.text}
      </span>
    </div>
  );
};

export default StatusIndicator;