import React from 'react';
import { Info } from 'lucide-react';

/**
 * InheritanceIndicator - Shows when a field value is inherited
 *
 * Displays a helpful message indicating the source of inheritance
 * (e.g., "Arves fra Parent Krav")
 */
const InheritanceIndicator = ({ source, sourceData }) => {
  if (!source || !sourceData) return null;

  // Determine the display text based on source type
  const getSourceLabel = () => {
    switch (source) {
      case 'parent':
        return 'overordnet';
      case 'krav':
        return 'tilknyttet Krav';
      case 'prosjektKrav':
        return 'tilknyttet Prosjektkrav';
      default:
        return source;
    }
  };

  // Get the title/name of the source entity
  const sourceTitle = sourceData.tittel || sourceData.title || sourceData.navn || sourceData.name || 'uten tittel';
  const sourceUID = sourceData.kravUID || sourceData.tiltakUID || sourceData.uid || sourceData.id;

  return (
    <div className="mt-2 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div className="text-blue-800">
        <span className="font-medium">Arves fra {getSourceLabel()}:</span>
        <span className="ml-1">{sourceTitle}</span>
        {sourceUID && (
          <span className="ml-1 text-blue-600">({sourceUID})</span>
        )}
      </div>
    </div>
  );
};

export default InheritanceIndicator;
