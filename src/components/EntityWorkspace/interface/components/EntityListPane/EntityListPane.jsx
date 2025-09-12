import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, FileText, Minimize2, Maximize2 } from "lucide-react";
import FlexScrollableContainer from "../FlexScrollableContainer";

/**
 * EntityListPane - Generic list interface using render prop pattern
 *
 * Features:
 * - Domain-controlled card rendering via EntityListCard
 * - Domain-controlled group headers via EntityListGroupHeader
 * - Domain-controlled list heading via EntityListHeading
 * - Group collapse/expand controls
 * - Generic list behavior (keyboard nav, selection, loading states)
 *
 * Requires render functions - no fallbacks, clean architecture only.
 */
const EntityListPane = ({
  items = [], // Main data prop (can be flat entities or grouped data)
  entityType,
  selectedEntity,
  onEntitySelect,
  onEntityDoubleClick,
  isLoading = false,
  isFetching = false,
  enableKeyboardNav = true,
  adapter = null,
  EntityListCard = null,
  EntityListGroupHeader = null,
  EntityListHeading = null,
  viewOptions: externalViewOptions = {},
  onSave = null, // Add onSave prop to pass through to renderers
}) => {
  const location = useLocation();
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const listContainerRef = useRef(null);

  // Check if we have grouped data structure (items contain emne objects)
  const hasGroupedData = items.length > 0 && items[0]?.group && items[0]?.items;
  const groupedItems = hasGroupedData ? items : [];

  // Check if we're in cards mode for grid layout
  const isCardsMode = externalViewOptions.viewMode === "cards";

  // Flatten all entities for keyboard navigation
  const allItems = useMemo(() => {
    if (hasGroupedData) {
      return items.flatMap((groupData) => groupData.items);
    }
    return items;
  }, [items, hasGroupedData]);

  // Debug: Check if allItems contains undefined entities

  // Get selected entity ID (use normalized renderId from adapter)
  const selectedEntityId = selectedEntity?.renderId;

  // Reset scroll position on navigation (multiple triggers for reliability)
  useEffect(() => {
    const resetScroll = () => {
      if (listContainerRef.current) {
        listContainerRef.current.scrollTop = 0;
      }
    };

    // Immediate reset
    resetScroll();

    // Delayed reset for cases where DOM isn't ready
    const timeoutId = setTimeout(resetScroll, 50);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, entityType, items.length > 0]); // Multiple triggers to ensure reset

  // Auto-scroll to selected entity when it changes
  useEffect(() => {
    if (selectedEntityId && listContainerRef.current) {
      // Add a small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        const selectedElement = listContainerRef.current?.querySelector(`[data-entity-id="${selectedEntityId}"]`);
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }, 100); // Small delay to allow DOM updates

      return () => clearTimeout(timeoutId);
    }
  }, [selectedEntityId, allItems.length]);

  // If the selected entity is a newly created placeholder, scroll the list to the top
  // so the user sees the create form / top of the list. This handles the case where
  // a new entity has no id/renderId yet and therefore won't be scrolled-to by the
  // selectedEntityId effect above.
  useEffect(() => {
    try {
      if (selectedEntity?.__isNew && listContainerRef.current) {
        // Small delay to ensure any DOM updates (e.g. form showing) have happened
        const tid = setTimeout(() => {
          listContainerRef.current.scrollTop = 0;
        }, 50);
        return () => clearTimeout(tid);
      }
    } catch (e) {
      // ignore
    }
  }, [selectedEntity?.__isNew]);

  // Group collapse/expand functions
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

  const collapseAll = () => {
    const allGroupKeys = groupedItems.map((group, groupIndex) => {
      // Use same key generation logic as in the rendering
      const itemIds = (group.items || []).map(item => item.id || item.renderId).join('-');
      return `${entityType}-group-${group.group?.emne?.id || "no-emne"}-${groupIndex}-${itemIds.substring(0, 20)}`;
    });
    setCollapsedGroups(new Set(allGroupKeys));
  };

  const expandAll = () => {
    setCollapsedGroups(new Set());
  };

  const allGroupsCollapsed =
    hasGroupedData &&
    groupedItems.length > 0 &&
    groupedItems.every((group, groupIndex) => {
      // Use same key generation logic as in collapseAll and rendering
      const itemIds = (group.items || []).map(item => item.id || item.renderId).join('-');
      const groupKey = `${entityType}-group-${group.group?.emne?.id || "no-emne"}-${groupIndex}-${itemIds.substring(0, 20)}`;
      return collapsedGroups.has(groupKey);
    });

  const handleEntitySelect = (entity, action) => {
    onEntitySelect?.(entity, action);
  };

  const handleEntityDoubleClick = (entity) => {
    onEntityDoubleClick?.(entity);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Domain-controlled via EntityListHeading */}
      {EntityListHeading && (() => {
        const headingProps = {
          itemCount: allItems.length,
          hasGroups: hasGroupedData && groupedItems.length > 0,
          allGroupsExpanded: !allGroupsCollapsed,
          onToggleAllGroups: allGroupsCollapsed ? expandAll : collapseAll,
        };
        //console.log('EntityListPane: Passing props to EntityListHeading:', headingProps);
        //console.log('EntityListPane: hasGroupedData =', hasGroupedData);
        //console.log('EntityListPane: groupedItems.length =', groupedItems.length);
        //console.log('EntityListPane: allGroupsCollapsed =', allGroupsCollapsed);
        return EntityListHeading(headingProps);
      })()}

      {/* Entity List */}
      <FlexScrollableContainer className="flex-1" dependencies={[allItems.length, collapsedGroups]} fadeColor="from-white">
        <div ref={listContainerRef}>
          {isLoading && allItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <Loader2 className="w-8 h-8 mx-auto mb-2 text-gray-300 animate-spin" />
                <p className="text-sm">Laster...</p>
              </div>
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Ingen elementer</p>
              </div>
            </div>
          ) : hasGroupedData ? (
            // Grouped rendering (with emne headers)
            <div>
              {groupedItems.map((groupData, groupIndex) => {
                // Create a more unique groupKey by including item IDs to handle duplicate emne contexts
                const itemIds = (groupData.items || []).map(item => item.id || item.renderId).join('-');
                const groupKey = `${entityType}-group-${groupData.group.emne?.id || "no-emne"}-${groupIndex}-${itemIds.substring(0, 20)}`;
                const isCollapsed = collapsedGroups.has(groupKey);
                const groupItems = groupData.items;

                return (
                  <div key={groupKey}>
                    {/* Group Header - Domain-controlled via EntityListGroupHeader */}
                    {EntityListGroupHeader &&
                      EntityListGroupHeader(groupData, {
                        isCollapsed,
                        onToggle: () => toggleGroupCollapse(groupKey),
                        itemCount: groupItems.length,
                      })}

                    {/* Group items */}
                    {!isCollapsed && (
                      <div className={isCardsMode ? "space-y-2 px-2 pb-2" : ""}>
                        {groupItems.map(
                          (entity, index) => {
                            // Create truly unique key using related krav context when available
                            // _relatedToKrav is a string number, not an object
                            const relatedKravId = entity._relatedToKrav || entity.parentId || '';
                            const uniqueKey = relatedKravId 
                              ? `${groupKey}-${entity.renderId}-related-${relatedKravId}`
                              : `${groupKey}-${entity.renderId}`;
                              
                            return EntityListCard &&
                            EntityListCard(entity, {
                              key: uniqueKey,
                              "data-entity-id": entity.renderId,
                              isSelected: entity.renderId === selectedEntityId || `${groupKey}-${entity.renderId}` === selectedEntityId,
                              editMode: entity.renderId === selectedEntityId && new URLSearchParams(window.location.search).get("editCard") === "true",
                              isFocused: focusedIndex === index,
                              onClick: handleEntitySelect,
                              onDoubleClick: handleEntityDoubleClick,
                              viewOptions: externalViewOptions,
                              onSave: onSave, // Pass onSave to renderer
                            });
                          }
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat rendering (no emne groups)
            <div className={isCardsMode ? "space-y-2 p-2" : ""}>
              {allItems.map(
                (entity, index) => {
                  // For non-grouped view, only select first occurrence of duplicate entities
                  const isFirstOccurrence = allItems.findIndex(e => e.renderId === entity.renderId) === index;
                  const isEntitySelected = entity.renderId === selectedEntityId;
                  
                  return EntityListCard &&
                  EntityListCard(entity, {
                    key: entity.renderId,
                    "data-entity-id": entity.renderId,
                    isSelected: isEntitySelected && isFirstOccurrence,
                    editMode: entity.renderId === selectedEntityId && new URLSearchParams(window.location.search).get("editCard") === "true",
                    isFocused: focusedIndex === index,
                    onClick: handleEntitySelect,
                    onDoubleClick: handleEntityDoubleClick,
                    viewOptions: externalViewOptions,
                    onSave: onSave, // Pass onSave to renderer
                  });
                }
              )}
            </div>
          )}
        </div>
      </FlexScrollableContainer>
    </div>
  );
};

export default EntityListPane;
