/**
 * EntityListItem - Individual list item component
 * Displays entity summary based on config-driven fields
 */

import React from 'react';
import { Badge } from '@/components/ui/primitives/badge';

const EntityListItem = ({ entity, entityType, isSelected, onClick }) => {
  // Get display fields based on entity type
  const getDisplayFields = () => {
    switch (entityType) {
      case 'krav':
      case 'prosjektKrav':
        return {
          title: entity.tittel || entity.kravUID,
          subtitle: entity.beskrivelse,
          badges: [
            entity.obligatorisk && { text: 'Obligatorisk', variant: 'destructive' },
            entity.status && { text: entity.status, variant: 'secondary' }
          ].filter(Boolean)
        };
      case 'tiltak':
      case 'prosjektTiltak':
        return {
          title: entity.navn || entity.tiltakUID,
          subtitle: entity.beskrivelse,
          badges: [
            entity.status && { text: entity.status, variant: 'secondary' }
          ].filter(Boolean)
        };
      default:
        return {
          title: entity.navn || entity.tittel || entity.id,
          subtitle: entity.beskrivelse,
          badges: []
        };
    }
  };

  const { title, subtitle, badges } = getDisplayFields();

  return (
    <div
      className={`
        p-3 rounded-lg border cursor-pointer transition-colors
        ${isSelected 
          ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500 ring-opacity-20' 
          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
        }
      `}
      onClick={onClick}
    >
      {/* Main content */}
      <div className="space-y-2">
        {/* Title */}
        <div className="font-medium text-gray-900 text-sm leading-tight">
          {title}
        </div>
        
        {/* Subtitle/Description */}
        {subtitle && (
          <div className="text-xs text-gray-600 line-clamp-2">
            {subtitle}
          </div>
        )}
        
        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant} className="text-xs">
                {badge.text}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-r" />
      )}
    </div>
  );
};

export default EntityListItem;