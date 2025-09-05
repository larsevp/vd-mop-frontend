import React, { useState, useMemo } from "react";
import { Loader2, FileText, Minimize2, Maximize2 } from "lucide-react";

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
  isLoading = false,
  isFetching = false,
  enableKeyboardNav = true,
  adapter = null,
  EntityListCard = null,
  EntityListGroupHeader = null,
  EntityListHeading = null,
  viewOptions: externalViewOptions = {},
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());

  // Check if we have grouped data structure (items contain emne objects)
  const hasGroupedData = items.length > 0 && items[0]?.group && items[0]?.items;
  const groupedItems = hasGroupedData ? items : [];
  
  console.log('EntityListPane debug:', {
    itemsLength: items.length,
    firstItem: items[0],
    hasGroupedData,
    groupedItemsLength: groupedItems.length
  });
  
  
  // Flatten all entities for keyboard navigation  
  const allItems = useMemo(() => {
    if (hasGroupedData) {
      return items.flatMap(groupData => groupData.items);
    }
    return items;
  }, [items, hasGroupedData]);

  // Get selected entity ID (use normalized renderId from adapter)
  const selectedEntityId = selectedEntity?.renderId;
  
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
    const allGroupKeys = groupedItems.map((group, groupIndex) => 
      `${entityType}-group-${group.emne?.id || "no-emne"}-${groupIndex}`
    );
    setCollapsedGroups(new Set(allGroupKeys));
  };

  const expandAll = () => {
    setCollapsedGroups(new Set());
  };

  const allGroupsCollapsed = hasGroupedData && groupedItems.length > 0 &&
    groupedItems.every((group, groupIndex) => {
      const groupKey = `${entityType}-group-${group.emne?.id || "no-emne"}-${groupIndex}`;
      return collapsedGroups.has(groupKey);
    });

  const handleEntitySelect = (entity) => {
    onEntitySelect?.(entity);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header - Domain-controlled via EntityListHeading */}
      {EntityListHeading && EntityListHeading({
        itemCount: allItems.length,
        children: hasGroupedData && groupedItems.length > 1 && (
          <button
            onClick={allGroupsCollapsed ? expandAll : collapseAll}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={allGroupsCollapsed ? "Vis alle emner" : "Skjul alle emner"}
          >
            {allGroupsCollapsed ? (
              <Maximize2 className="w-3 h-3 text-gray-500" />
            ) : (
              <Minimize2 className="w-3 h-3 text-gray-500" />
            )}
          </button>
        )
      })}

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto">
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
              const groupKey = `${entityType}-group-${groupData.group.emne?.id || "no-emne"}-${groupIndex}`;
              const isCollapsed = collapsedGroups.has(groupKey);
              const groupItems = groupData.items;
              
              return (
                <div key={groupKey}>
                  {/* Group Header - Domain-controlled via EntityListGroupHeader */}
                  {EntityListGroupHeader && EntityListGroupHeader(groupData, {
                    isCollapsed,
                    onToggle: () => toggleGroupCollapse(groupKey),
                    itemCount: groupItems.length
                  })}
                  
                  {/* Group items */}
                  {!isCollapsed &&
                    groupItems.map((entity, index) => 
                      EntityListCard && EntityListCard(entity, {
                        key: entity.renderId,
                        isSelected: entity.renderId === selectedEntityId,
                        isFocused: focusedIndex === index,
                        onClick: handleEntitySelect,
                        viewOptions: externalViewOptions
                      })
                    )}
                </div>
              );
            })}
          </div>
        ) : (
          // Flat rendering (no emne groups)
          <div>
            {allItems.map((entity, index) => 
              EntityListCard && EntityListCard(entity, {
                key: entity.renderId,
                isSelected: entity.renderId === selectedEntityId,
                isFocused: focusedIndex === index,
                onClick: handleEntitySelect,
                viewOptions: externalViewOptions
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityListPane;