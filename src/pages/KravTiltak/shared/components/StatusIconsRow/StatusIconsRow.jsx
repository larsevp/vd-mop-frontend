import React from 'react';
import StatusIndicator from '../StatusIndicator';
import { getStatusDisplay, getVurderingDisplay, getPrioritetDisplay } from '../../utils/statusHelpers';

/**
 * StatusIconsRow - Compact row of status indicator icons
 *
 * Displays vurdering, status, and prioritet icons in a horizontal row
 * Used inline with card titles for compact display
 */
const StatusIconsRow = ({ entity, viewOptions = {} }) => {
  // Get display data for each status type
  const vurderingDisplay = viewOptions.showVurdering ? getVurderingDisplay(entity) : null;
  const statusDisplay = viewOptions.showStatus ? getStatusDisplay(entity) : null;
  const prioritetDisplay = viewOptions.showPrioritet ? getPrioritetDisplay(entity) : null;

  // Check if we have any status to show
  const hasAnyStatus = vurderingDisplay || statusDisplay || prioritetDisplay;

  if (!hasAnyStatus) return null;

  return (
    <div className="flex items-center gap-1 flex-shrink-0">
      {vurderingDisplay && <StatusIndicator display={vurderingDisplay} iconOnly />}
      {statusDisplay && <StatusIndicator display={statusDisplay} iconOnly />}
      {prioritetDisplay && <StatusIndicator display={prioritetDisplay} iconOnly />}
    </div>
  );
};

export default StatusIconsRow;
