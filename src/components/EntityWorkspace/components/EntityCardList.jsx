import React, { useCallback } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Plus, Settings, ChevronDown, ChevronRight, FileText } from "lucide-react";
import EntityCardController from "./EntityCardController";

/**
 * Generic EntityCardList component
 * Renders entities as cards, with optional grouping support
 * Now fully implemented with card rendering and grouping logic
 */
const EntityCardList = ({
  items,
  modelConfig,
  entityType,
  config,
  groupByEmne,
  collapsedGroups,
  expandedCards,
  activeEntity,
  showMerknader,
  searchQuery,
  filterBy,
  onCreateNew,
  onToggleGroupCollapse,
  setExpandedCards,
  setActiveEntity,
  onSave,
  onDelete,
  renderIcon,
  user,
}) => {
  // Card expansion handlers
  const handleExpandCard = useCallback(
    (entity, mode = "view") => {
      setExpandedCards((prev) => {
        const newMap = new Map(prev);
        if (newMap.has(entity.id) && newMap.get(entity.id) === mode) {
          // If already expanded in same mode, collapse it
          newMap.delete(entity.id);
          // If we're collapsing and this was the active entity, clear it
          setActiveEntity((current) => (current?.id === entity.id ? null : current));
        } else {
          // Expand in specified mode
          newMap.set(entity.id, mode);
          // Only set as active if it's not just a view expansion or if no active entity exists
          if (mode === "edit" || mode === "create" || !activeEntity) {
            setActiveEntity(entity);
          }
        }
        return newMap;
      });
    },
    [activeEntity, setExpandedCards, setActiveEntity]
  );

  const handleCollapseCard = useCallback(
    (entityId) => {
      setExpandedCards((prev) => {
        const newMap = new Map(prev);
        newMap.delete(entityId);
        return newMap;
      });
      // If we're collapsing the active entity, clear it
      setActiveEntity((current) => (current?.id === entityId ? null : current));
    },
    [setExpandedCards, setActiveEntity]
  );

  const handleSaveEntity = useCallback(
    async (data) => {
      try {
        const savedEntity = await onSave(data, !!data.id);

        // Update the active entity with saved data
        setActiveEntity(savedEntity);

        // Keep the card expanded but switch to view mode
        if (data.id === "create-new") {
          // For newly created entity, update the expansion map with the real ID
          setExpandedCards((prev) => {
            const newMap = new Map(prev);
            newMap.delete("create-new");
            newMap.set(savedEntity.id, "view");
            return newMap;
          });
        } else {
          // For existing entity, just update the mode to view
          setExpandedCards((prev) => {
            const newMap = new Map(prev);
            newMap.set(data.id, "view");
            return newMap;
          });
        }

        return savedEntity;
      } catch (error) {
        // Error handled by parent hook
        throw error;
      }
    },
    [onSave, setActiveEntity, setExpandedCards]
  );

  // Empty state
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 shadow-sm text-center">
        <Settings className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 mb-2">
          {searchQuery || filterBy !== "all"
            ? `Ingen ${modelConfig.title?.toLowerCase() || entityType} funnet`
            : `Ingen ${modelConfig.title?.toLowerCase() || entityType} ennå`}
        </h3>
        <p className="text-neutral-600 mb-6">
          {searchQuery || filterBy !== "all" ? "Prøv å justere søkekriteriene dine" : `Kom i gang ved å opprette ditt første ${entityType}`}
        </p>
        {!searchQuery && filterBy === "all" && (
          <Button onClick={onCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {modelConfig.newButtonLabel || `Opprett første ${entityType}`}
          </Button>
        )}
      </div>
    );
  }

  // Content rendering
  return (
    <div className="space-y-4">
      {/* Create New Entity Card - Always show when in create mode */}
      {expandedCards.has("create-new") && (
        <EntityCardController
          key="create-new"
          entity={{ id: "create-new", enhetId: user?.enhetId }}
          modelConfig={modelConfig}
          entityType={entityType}
          isExpanded={true}
          expandedMode="create"
          onExpand={handleExpandCard}
          onCollapse={handleCollapseCard}
          onEdit={() => {}}
          onDelete={() => {}}
          onSave={handleSaveEntity}
          onMerknadUpdate={() => {}} // No merknad for create mode
          onStatusChange={() => {}} // No status changes for create mode
          onVurderingChange={() => {}} // No vurdering for create mode
          onPrioritetChange={() => {}} // No prioritet for create mode
          onNavigateToEntity={() => {}}
          showMerknader={showMerknader}
          showStatus={config.ui.showStatus}
          showVurdering={config.ui.showVurdering}
          showPrioritet={config.ui.showPrioritet}
          filesCount={0}
          childrenCount={0}
          parentEntity={null}
          renderIcon={renderIcon}
        />
      )}

      {groupByEmne && config.features.grouping ? (
        // Grouped view - show Emne headings with entities underneath
        <div className="space-y-8">
          {items.map((group) => {
            const groupKey = group.emne?.id || "no-emne";
            const isCollapsed = collapsedGroups.has(groupKey);

            // Get entities from the group - check multiple possible property names
            const entities = group[entityType] || group.entities || group.krav || group.tiltak || [];

            return (
              <div
                key={groupKey}
                className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                {/* Emne Header - Clickable to toggle collapse */}
                <div
                  className="bg-gradient-to-r from-gray-50 to-white border-b border-neutral-200 p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => onToggleGroupCollapse(groupKey)}
                >
                  <div className="flex items-center gap-4">
                    {/* Collapse/Expand Icon */}
                    <div className="text-gray-500 hover:text-gray-700 transition-colors">
                      {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </div>

                    {/* Emne Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: group.emne?.color || "#6b7280" }}
                    >
                      {group.emne?.icon ? renderIcon(group.emne.icon, 24) : <FileText size={24} />}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-neutral-900 mb-1">{group.emne?.tittel || "Ingen emne"}</h3>
                      <div className="flex items-center gap-4 text-sm text-neutral-600">
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-4 w-4" />
                          {entities.length} {entities.length === 1 ? entityType : entityType}
                        </span>
                        {group.emne?.beskrivelse && (
                          <span className="hidden sm:block">
                            {group.emne.beskrivelse.length > 60 ? `${group.emne.beskrivelse.substring(0, 60)}...` : group.emne.beskrivelse}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Entity Cards - Collapsible */}
                {!isCollapsed && (
                  <div className="p-6 space-y-4">
                    {entities.map((entity, entityIndex) => {
                      // Generate unique key for combined views considering relationship context
                      let entityKey;
                      if ((entityType === "combined" || entityType === "combinedEntities") && entity._relatedToKrav) {
                        // For tiltak displayed under krav in combined view, include the relationship
                        entityKey = `${entity.entityType || entityType}-${entity.id}-krav-${entity._relatedToKrav}`;
                      } else {
                        // Standard key generation for regular views or non-related entities
                        entityKey = `${entity.entityType || entityType}-${entity.id}`;
                      }

                      return (
                        <EntityCardController
                          key={entityKey}
                          entity={entity}
                          modelConfig={modelConfig}
                          entityType={entityType}
                          isExpanded={expandedCards.has(entity.id)}
                          expandedMode={expandedCards.get(entity.id) || "view"}
                          onExpand={handleExpandCard}
                          onCollapse={handleCollapseCard}
                          onEdit={(entity) => handleExpandCard(entity, "edit")}
                          onDelete={onDelete}
                          onSave={handleSaveEntity}
                          onMerknadUpdate={() => {}} // TODO: Implement merknad updates
                          onStatusChange={() => {}} // TODO: Implement status changes
                          onVurderingChange={() => {}} // TODO: Implement vurdering changes
                          onPrioritetChange={() => {}} // TODO: Implement prioritet changes
                          onNavigateToEntity={() => {}} // TODO: Implement navigation
                          showMerknader={showMerknader}
                          showStatus={config.ui.showStatus}
                          showVurdering={config.ui.showVurdering}
                          showPrioritet={config.ui.showPrioritet}
                          filesCount={entity.filesCount || 0}
                          childrenCount={entity.childrenCount || 0}
                          parentEntity={entity.parent || null}
                          renderIcon={renderIcon}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Flat view - show all entities as individual cards
        <div className="space-y-4">
          {items.map((entity, entityIndex) => {
            // Generate unique key for combined views considering relationship context
            let entityKey;
            if ((entityType === "combined" || entityType === "combinedEntities") && entity._relatedToKrav) {
              // For tiltak displayed under krav in combined view, include the relationship
              entityKey = `${entity.entityType || entityType}-${entity.id}-krav-${entity._relatedToKrav}`;
            } else {
              // Standard key generation for regular views or non-related entities
              entityKey = `${entity.entityType || entityType}-${entity.id}`;
            }

            return (
              <EntityCardController
                key={entityKey}
                entity={entity}
                modelConfig={modelConfig}
                entityType={entityType}
                isExpanded={expandedCards.has(entity.id)}
                expandedMode={expandedCards.get(entity.id) || "view"}
                onExpand={handleExpandCard}
                onCollapse={handleCollapseCard}
                onEdit={(entity) => handleExpandCard(entity, "edit")}
                onDelete={onDelete}
                onSave={handleSaveEntity}
                onMerknadUpdate={() => {}} // TODO: Implement merknad updates
                onStatusChange={() => {}} // TODO: Implement status changes
                onVurderingChange={() => {}} // TODO: Implement vurdering changes
                onPrioritetChange={() => {}} // TODO: Implement prioritet changes
                onNavigateToEntity={() => {}} // TODO: Implement navigation
                showMerknader={showMerknader}
                showStatus={config.ui.showStatus}
                showVurdering={config.ui.showVurdering}
                showPrioritet={config.ui.showPrioritet}
                filesCount={entity.filesCount || 0}
                childrenCount={entity.childrenCount || 0}
                parentEntity={entity.parent || null}
                renderIcon={renderIcon}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EntityCardList;
