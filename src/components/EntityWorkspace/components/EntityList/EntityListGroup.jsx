/**
 * EntityListGroup - Grouped list items for emne-based grouping
 * Used when groupByEmne is enabled (krav, prosjektKrav)
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import EntityListItem from './EntityListItem';

const EntityListGroup = ({ emneId, entities, selectedEntityId, onSelectEntity }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  // Get emne info (you might want to fetch this from a service)
  const getEmneDisplayName = (emneId) => {
    if (emneId === 'ungrouped') return 'Uten emne';
    // TODO: Fetch actual emne name from cache/service
    return `Emne ${emneId}`;
  };

  const emneName = getEmneDisplayName(emneId);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Group header */}
      <div 
        className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown size={16} className="text-gray-500" />
        ) : (
          <ChevronRight size={16} className="text-gray-500" />
        )}
        <div className="flex-1">
          <div className="font-medium text-sm text-gray-900">{emneName}</div>
          <div className="text-xs text-gray-500">{entities.length} items</div>
        </div>
      </div>

      {/* Group items */}
      {isExpanded && (
        <div className="bg-white">
          {entities.map((entity) => (
            <div key={entity.id} className="border-b border-gray-50 last:border-b-0">
              <EntityListItem
                entity={entity}
                entityType="krav" // Groups are only used for krav
                isSelected={selectedEntityId === entity.id}
                onClick={() => onSelectEntity(entity)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EntityListGroup;