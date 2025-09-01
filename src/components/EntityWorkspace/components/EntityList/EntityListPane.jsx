import React, { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, ChevronRight, FileText } from "lucide-react";
import EntityListRow from "./EntityListRow";
import EntityListViewOptions from "./EntityListViewOptions";

/**
 * Clean, minimal left pane for entity list
 * Features:
 * - Integrated search and filters
 * - Two-line entity rows
 * - Keyboard navigation
 * - Clean, scannable design
 */
import { EntityTypeTranslator } from "@/components/EntityWorkspace/utils/entityTypeTranslator";
import useEntityWorkspaceStore from "@/components/EntityWorkspace/stores/entityWorkspaceStore";

const EntityListPane = ({
  items,
  modelConfig,
  entityType,
  config,
  selectedEntityId,
  onEntitySelect,
  searchQuery,
  isLoading,
  isFetching,
  enableKeyboardNav = true,
  renderIcon,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  // Generate unique ID for combined view items that may have duplicates
  const generateUniqueEntityId = (item) => {
    // Check if we're in a combined view context
    const isCombinedView = entityType === "combined" || entityType === "combinedEntities" || entityType === "prosjekt-combined";
    
    // For regular (non-combined) views, always use simple numeric ID
    if (!isCombinedView) {
      return item.id?.toString();
    }
    
    // Combined view logic - need complex IDs to avoid conflicts
    if (!item.entityType) {
      return item.id?.toString();
    }

    // Normalize entityType to lowercase for consistency
    const normalizedEntityType = item.entityType.toLowerCase();

    // For combined view items that might be duplicated (same tiltak under different krav)
    if (item._relatedToKrav !== undefined) {
      return `${normalizedEntityType}-${item.id}-krav-${item._relatedToKrav}`;
    }

    // Standard unique ID for combined view items
    return `${normalizedEntityType}-${item.id}`;
  };

  // Get default view options from model config
  const getDefaultViewOptions = () => {
    const defaults = modelConfig?.workspace?.ui || {};

    // Try to load saved view options first
    const saved = localStorage.getItem(`${entityType}-viewOptions`);
    if (saved) {
      try {
        const savedOptions = JSON.parse(saved);
        // Merge with defaults to ensure all options exist
        return {
          showHierarchy: savedOptions.showHierarchy ?? defaults.showHierarchy ?? true,
          showVurdering: savedOptions.showVurdering ?? defaults.showVurdering ?? false,
          showStatus: savedOptions.showStatus ?? defaults.showStatus ?? false,
          showPrioritet: savedOptions.showPrioritet ?? defaults.showPrioritet ?? false,
          showObligatorisk: savedOptions.showObligatorisk ?? defaults.showObligatorisk ?? true,
          showMerknad: savedOptions.showMerknad ?? defaults.showMerknad ?? false,
          showRelations: savedOptions.showRelations ?? defaults.showRelations ?? true,
        };
      } catch (e) {
        console.warn("Failed to parse saved view options, using defaults");
      }
    }

    // Fallback to defaults
    return {
      showHierarchy: defaults.showHierarchy ?? true,
      showVurdering: defaults.showVurdering ?? false,
      showStatus: defaults.showStatus ?? false,
      showPrioritet: defaults.showPrioritet ?? false,
      showObligatorisk: defaults.showObligatorisk ?? true,
      showMerknad: defaults.showMerknad ?? false,
      showRelations: defaults.showRelations ?? true,
    };
  };

  const [viewOptions, setViewOptions] = useState(getDefaultViewOptions);

  // Save view options to localStorage when they change
  useEffect(() => {
    localStorage.setItem(`${entityType}-viewOptions`, JSON.stringify(viewOptions));
  }, [entityType, viewOptions]);
  const listRef = useRef(null);
  const prevSelectedEntityId = useRef(null);
  const isInitialMount = useRef(true);
  
  // Get the isEntityJustCreated flag from the store
  const isEntityJustCreated = useEntityWorkspaceStore((state) => state.isEntityJustCreated);
  const clearJustCreatedFlag = useEntityWorkspaceStore((state) => state.clearJustCreatedFlag);
  
  // Debug the store flag
  console.log('🏪 Store isEntityJustCreated flag:', isEntityJustCreated);

  // Map entityType to the actual property name in grouped data (same as EntityFilterService)
  const getGroupedDataPropertyName = (entityType) => {
    return EntityTypeTranslator.translate(entityType, "lowercase");
  };

  // Use items directly - backend provides properly grouped data
  const groupedItems = items || [];

  // Flatten for keyboard navigation - build with proper indexing
  const allItems = useMemo(() => {
    const flattened = [];
    const propertyName = getGroupedDataPropertyName(entityType);
    const isCombinedView = entityType === "combined" || entityType === "combinedEntities" || entityType === "prosjekt-combined";

    groupedItems.forEach((group) => {
      if (isCombinedView) {
        // For combined views, use entities array which contains mixed krav/tiltak
        const groupItems = group.entities || [];
        flattened.push(...groupItems);
      } else {
        // Regular entity views use single property
        const groupItems = group[propertyName] || group[entityType] || group.entities || group.tiltak || group.krav || [];
        flattened.push(...groupItems);
      }
    });
    return flattened;
  }, [groupedItems, entityType]);

  // Create a mapping from entity unique ID to flat index for consistent focus
  const entityIndexMap = useMemo(() => {
    const map = new Map();
    allItems.forEach((item, index) => {
      const uniqueId = item.entityType ? `${item.entityType}-${item.id}` : item.id;
      map.set(uniqueId, index);
    });
    return map;
  }, [allItems]);

  // Toggle group collapse
  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNav) return;

    const handleKeyDown = (e) => {
      // Global shortcuts for list navigation
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, allItems.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (allItems[focusedIndex]) {
            onEntitySelect(allItems[focusedIndex]);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardNav, allItems, focusedIndex, onEntitySelect]);

  // Auto-scroll to newly created entities
  useEffect(() => {
    const hasSelectedEntityId = !!selectedEntityId;
    const isEntityIdChanged = selectedEntityId !== prevSelectedEntityId.current;
    const isFromCreateNew = prevSelectedEntityId.current === "create-new";
    const isFromNull = prevSelectedEntityId.current === null;
    
    // Don't auto-scroll on initial mount/page refresh - only on genuine null-to-entity transitions
    const isGenuineFromNull = isFromNull && !isInitialMount.current;
    
    const hasListRef = !!listRef.current;
    
    
    // Only log if there's a potential trigger
    if (isEntityJustCreated) {
      console.log('🔍 AutoScroll check:', {
        hasSelectedEntityId,
        isEntityIdChanged,
        isEntityJustCreated,
        hasListRef,
        selectedEntityId,
        willTrigger: hasSelectedEntityId && isEntityIdChanged && isEntityJustCreated && hasListRef
      });
    }

    if (
      hasSelectedEntityId &&
      isEntityIdChanged &&
      isEntityJustCreated &&
      hasListRef
    ) {
      console.log('✅ AutoScroll TRIGGERED!');
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        // Try first with the full selectedEntityId
        let selectedElement = listRef.current.querySelector(`[data-entity-id="${selectedEntityId}"]`);
        
        // If not found, try with lowercase version (handle case mismatch)
        if (!selectedElement) {
          const lowercaseId = selectedEntityId.toLowerCase();
          selectedElement = listRef.current.querySelector(`[data-entity-id="${lowercaseId}"]`);
        }

        // If not found and selectedEntityId is complex (contains dashes), extract the actual entity ID
        if (!selectedElement && selectedEntityId.includes("-")) {
          // For complex IDs like "krav-123-emne-456", extract the numeric part
          const parts = selectedEntityId.split("-");
          const entityId = parts[1]; // Assume format is "type-id-context"
          if (entityId) {
            selectedElement = listRef.current.querySelector(`[data-entity-id="${entityId}"]`);
          }
        }

        // Check if the parent group is collapsed - if so, expand it first
        if (selectedElement) {
          const entityId = selectedEntityId;
          const targetEntity = allItems.find(item => {
            const itemUniqueId = generateUniqueEntityId(item);
            return itemUniqueId === entityId?.toString();
          });
          
          if (targetEntity) {
            // Find the group this entity belongs to and ensure it's not collapsed
            groupedItems.forEach((group, groupIndex) => {
              const groupKey = `${entityType}-group-${group.emne?.id || "no-emne"}-${groupIndex}`;
              const propertyName = getGroupedDataPropertyName(entityType);
              const isCombinedView = entityType === "combined" || entityType === "combinedEntities" || entityType === "prosjekt-combined";
              
              let groupItems = [];
              if (isCombinedView) {
                groupItems = group.entities || [];
              } else {
                groupItems = group[propertyName] || group[entityType] || group.entities || group.tiltak || group.krav || [];
              }
              
              // Check if our target entity is in this group
              const entityInGroup = groupItems.some(item => {
                const itemUniqueId = generateUniqueEntityId(item);
                return itemUniqueId === entityId?.toString();
              });
              
              if (entityInGroup && collapsedGroups.has(groupKey)) {
                setCollapsedGroups(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(groupKey);
                  return newSet;
                });
                // Add extra delay to allow group expansion animation
                setTimeout(() => {
                  const updatedElement = listRef.current.querySelector(`[data-entity-id="${selectedEntityId}"]`);
                  if (updatedElement) {
                    updatedElement.scrollIntoView({ behavior: "smooth", block: "center" });
                  }
                }, 200);
                return; // Exit early since we're expanding group
              }
            });
          }
          
          selectedElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        
        // Clear the "just created" flag after scrolling
        if (isEntityJustCreated) {
          clearJustCreatedFlag();
        }
      }, 100);
    }

    prevSelectedEntityId.current = selectedEntityId;
    isInitialMount.current = false; // Mark that we're no longer on initial mount
  }, [selectedEntityId, isEntityJustCreated]);

  return (
    <div className="flex flex-col h-full">
      {/* Clean entity list */}
      <div ref={listRef} className="flex-1 overflow-y-auto  ">
        {/* List header with view options */}
        <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-900">
            {allItems.length} {allItems.length === 1 ? entityType : entityType}
          </div>
          <EntityListViewOptions viewOptions={viewOptions} onViewOptionsChange={setViewOptions} />
        </div>

        {/* Loading state */}
        {isLoading && items.length === 0 && (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Laster {entityType}...</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-3">{renderIcon("FileText", 48)}</div>
            {searchQuery ? (
              <>
                <p className="text-sm text-gray-900 font-medium mb-1">Ingen resultater for "{searchQuery}"</p>
                <p className="text-xs text-gray-500">Prøv å justere søkeordene eller fjern filtre</p>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-900 font-medium mb-1">Ingen {entityType} ennå</p>
                <p className="text-xs text-gray-500">Kom i gang ved å opprette ditt første {entityType} med knappen i headeren</p>
              </>
            )}
          </div>
        )}

        {/* Grouped entity rows */}
        {!isLoading &&
          groupedItems.length > 0 &&
          groupedItems.map((group, groupIndex) => {
            const groupKey = `${entityType}-group-${group.emne?.id || "no-emne"}-${groupIndex}`;
            const isCollapsed = collapsedGroups.has(groupKey);
            const propertyName = getGroupedDataPropertyName(entityType);
            // Handle combined entity groups that have both krav and tiltak arrays
            let groupItems = [];
            const isCombinedView = entityType === "combined" || entityType === "combinedEntities" || entityType === "prosjekt-combined";
            
            if (isCombinedView) {
              // For combined views, use entities array which contains mixed krav/tiltak
              groupItems = group.entities || [];
            } else {
              // Regular entity views use single property
              groupItems = group[propertyName] || group[entityType] || group.entities || group.tiltak || group.krav || [];
            }

            return (
              <div key={groupKey}>
                {/* Emne header */}
                <div
                  className="sticky top-0 bg-white px-4 py-3 cursor-pointer transition-colors z-10"
                  onClick={() => toggleGroupCollapse(groupKey)}
                >
                  <div className="flex items-center gap-3">
                    {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}

                    {/* Emne Icon */}
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: group.emne?.color || "#6b7280" }}
                    >
                      <div className="text-white">{group.emne?.icon ? renderIcon(group.emne.icon, 14) : <FileText size={14} />}</div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{group.emne?.tittel || "Uten emne"}</h3>
                        <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                          {groupItems.length} {entityType}
                        </span>
                      </div>
                      {group.emne?.beskrivelse && <p className="text-xs text-gray-600 mt-1 truncate">{group.emne.beskrivelse}</p>}
                    </div>
                  </div>
                </div>

                {/* Group items */}
                {!isCollapsed &&
                  groupItems.map((entity, index) => {
                    const entityUniqueId = entity.entityType ? `${entity.entityType}-${entity.id}` : entity.id;
                    const globalIndex = entityIndexMap.get(entityUniqueId) ?? -1;

                    // Generate unique key for combined views considering relationship context
                    let entityKey;
                    if ((entityType === "combined" || entityType === "combinedEntities") && entity._relatedToKrav) {
                      // For tiltak displayed under krav in combined view, include the relationship
                      entityKey = `${entity.entityType || entityType}-${entity.id || index}-${group.emne?.id || "no-emne"}-krav-${
                        entity._relatedToKrav
                      }`;
                    } else {
                      // Standard key generation for regular views or non-related entities
                      entityKey = `${entity.entityType || entityType}-${entity.id || index}-${group.emne?.id || "no-emne"}`;
                    }

                    return (
                      <EntityListRow
                        key={entityKey}
                        entity={entity}
                        modelConfig={modelConfig}
                        entityType={entityType}
                        isSelected={(() => {
                          const entityUniqueId = generateUniqueEntityId(entity);
                          return entityUniqueId === selectedEntityId?.toString();
                        })()}
                        isFocused={globalIndex === focusedIndex}
                        onClick={() => onEntitySelect(entity)}
                        onFocus={(index) => setFocusedIndex(typeof index === "number" ? index : globalIndex)}
                        renderIcon={renderIcon}
                        viewOptions={viewOptions}
                      />
                    );
                  })}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default EntityListPane;
