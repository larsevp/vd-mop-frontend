import React from 'react';
import EntityBadge from '@/pages/KravTiltak/shared/components/EntityBadge/EntityBadge';

/**
 * EntityTableOfContents - Sticky sidebar TOC for cards/article view
 *
 * Shows a compact list of entities with badges and titles for quick navigation
 * Spans full vertical height and stays fixed while content scrolls
 */
const EntityTableOfContents = ({
  entities = [],
  selectedEntity,
  onEntitySelect,
  entityType,
}) => {
  if (!entities || entities.length === 0) {
    return null;
  }

  return (
    <div className="w-64 border-r border-gray-200 bg-white flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
      <div className="p-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
          Innhold
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {entities.length} {entities.length === 1 ? 'element' : 'elementer'}
        </p>
      </div>

      <nav className="p-2">
        {entities.map((entity, index) => {
          const isSelected = selectedEntity?.id === entity.id;

          // Extract UID - handle both direct properties and nested entities
          const uid = entity.kravUID || entity.tiltakUID || entity.prosjektKravUID || entity.prosjektTiltakUID || entity.uid || entity.id;

          // Extract title - try multiple common field names
          const title = entity.tittel || entity.title || entity.navn || entity.name || `${entityType || 'Element'} ${entity.id}`;

          // Extract badge info from emne
          const badgeColor = entity.emne?.color;
          const badgeText = entity.emne?.tittel?.charAt(0) || entity.emne?.title?.charAt(0);

          console.log('TOC Entity:', { id: entity.id, tittel: entity.tittel, title, uid, entity });

          return (
            <button
              key={`toc-${entity.id}-${index}`}
              onClick={() => onEntitySelect(entity)}
              className={`w-full text-left px-2 py-2 rounded-md mb-1 transition-colors duration-150 ${
                isSelected
                  ? 'bg-primary/10 border-l-2 border-l-primary'
                  : 'hover:bg-gray-50 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <EntityBadge
                  uid={uid}
                  badgeColor={badgeColor}
                  badgeText={badgeText}
                  size="xs"
                />
                <span className={`text-sm truncate ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                  {title}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default EntityTableOfContents;
