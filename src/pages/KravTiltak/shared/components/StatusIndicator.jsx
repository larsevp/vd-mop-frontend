import React from 'react';
import { getIconComponent } from '../utils/iconHelpers';

/**
 * Generic StatusIndicator component for displaying status, vurdering, prioritet
 * Used across KravTiltak domain entities
 */
const StatusIndicator = ({ display }) => {
  if (!display) return null;
  
  const IconComponent = display.icon ? getIconComponent(display.icon) : null;
  
  return (
    <div className="flex items-center gap-1">
      {IconComponent && (
        <div style={{ color: display.color }}>
          <IconComponent size={12} />
        </div>
      )}
      <span className="text-xs">
        {display.text}
      </span>
    </div>
  );
};

export default StatusIndicator;