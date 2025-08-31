/**
 * EntityList - Simplified list component for split layout
 * Supports: krav, tiltak, prosjektKrav, prosjektTiltak
 */

import React from 'react';
import useEntityWorkspaceStore from '@/components/EntityWorkspace/stores/entityWorkspaceStore';
import EntityListItem from './EntityListItem';
import EntityListGroup from './EntityListGroup';

const EntityList = () => {
  const { 
    currentEntityType: entityType,
    filteredEntities, 
    groupedEntities,
    groupByEmne,
    isLoading,
    selectedEntity,
    setSelectedEntity,
    workspaceConfig,
    error
  } = useEntityWorkspaceStore();

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>Error loading {entityType}</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // Render grouped entities (for krav)
  if (groupByEmne && groupedEntities.size > 0) {
    return (
      <div className="entity-list h-full flex flex-col">
        {/* List header */}
        <div className="p-4 border-b bg-white">
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">
              {workspaceConfig.title || entityType} ({filteredEntities.length})
            </h2>
          </div>
        </div>

        {/* Grouped items */}
        <div className="flex-1 overflow-y-auto">
          {Array.from(groupedEntities.entries()).map(([emneId, entities]) => (
            <EntityListGroup
              key={emneId}
              emneId={emneId}
              entities={entities}
              selectedEntityId={selectedEntity?.id}
              onSelectEntity={handleSelectEntity}
            />
          ))}
        </div>
      </div>
    );
  }

  // Render flat list (for tiltak, prosjektKrav, prosjektTiltak)
  return (
    <div className="entity-list h-full flex flex-col">
      {/* List header */}
      <div className="p-4 border-b bg-white">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold text-gray-900">
            {workspaceConfig.title || entityType} ({filteredEntities.length})
          </h2>
        </div>
      </div>

      {/* List items */}
      <div className="flex-1 overflow-y-auto">
        {filteredEntities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4 opacity-20">📋</div>
            <p>No {entityType} found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredEntities.map((entity) => (
              <EntityListItem
                key={entity.id}
                entity={entity}
                entityType={entityType}
                isSelected={selectedEntity?.id === entity.id}
                onClick={() => handleSelectEntity(entity)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityList;