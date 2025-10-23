import React from 'react';

/**
 * EntityBadge - Unified badge component for displaying entity UID and type
 *
 * Scandinavian design: Clean, minimal, color-coded
 * - Emerald for Krav entities
 * - Sky for Tiltak entities
 * - Monospace UID with separator
 */
const EntityBadge = ({ uid, entityType, badgeColor, badgeText, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`inline-flex items-center rounded-md font-medium ${sizeClass} ${badgeColor}`}>
      {uid ? (
        <>
          <span className="font-mono">{uid}</span>
          <span className="mx-1.5">·</span>
          <span>{badgeText}</span>
        </>
      ) : (
        <span>{badgeText}</span>
      )}
    </span>
  );
};

export default EntityBadge;
