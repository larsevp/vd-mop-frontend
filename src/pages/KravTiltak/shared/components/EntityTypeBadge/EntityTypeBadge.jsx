import React from 'react';

/**
 * EntityTypeBadge - Letter badge (K/T) for entity type display
 *
 * Displays a simple letter badge indicating entity type:
 * - K for Krav entities (Krav, ProsjektKrav)
 * - T for Tiltak entities (Tiltak, ProsjektTiltak)
 *
 * Used in both article and split views with different sizing and color variants
 */
const EntityTypeBadge = ({
  entityType,
  isChild = false,
  size = 'default', // 'small' (w-5 h-5) | 'default' (w-6 h-6) | 'large' (w-8 h-8)
  colored = false // Whether to use entity type colors (true for article view) or grayscale (false for split view)
}) => {
  const isKrav = entityType?.toLowerCase().includes('krav');
  const letter = isKrav ? 'K' : 'T';

  // Size variants
  let sizeClasses;
  if (size === 'small') {
    sizeClasses = 'w-5 h-5 text-xs';
  } else if (size === 'large') {
    sizeClasses = 'w-8 h-8 text-base';
  } else {
    sizeClasses = 'w-6 h-6 text-sm';
  }

  // Color variants
  let colorClasses;
  if (colored) {
    // Article view: Use entity type colors
    if (isChild) {
      colorClasses = isKrav
        ? 'text-emerald-600 border-emerald-600 opacity-50'
        : 'text-sky-600 border-sky-600 opacity-50';
    } else {
      colorClasses = isKrav
        ? 'text-emerald-600 border-emerald-600'
        : 'text-sky-600 border-sky-600';
    }
  } else {
    // Split view: Use grayscale
    const opacityClass = isChild ? 'opacity-50' : '';
    colorClasses = `border-slate-400 text-slate-600 ${opacityClass}`;
  }

  return (
    <div className={`${sizeClasses} ${colorClasses} rounded-full border flex items-center justify-center font-semibold`}>
      {letter}
    </div>
  );
};

export default EntityTypeBadge;
