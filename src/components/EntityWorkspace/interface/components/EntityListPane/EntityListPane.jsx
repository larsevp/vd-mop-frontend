import React, { useState, useMemo, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Loader2, FileText, Minimize2, Maximize2 } from "lucide-react";

/**
 * EntityListPane - Generic list interface using render prop pattern
 *
 * NOMENCLATURE: Generic List Component
 * =====================================
 *
 * This component is used in BOTH view modes:
 *
 * 1. ARTICLE VIEW - TOC (Left Sidebar)
 *    - viewOptions.isTOCMode = true
 *    - Compact, minimal styling for navigation
 *    - No badges, icons, arrows, or metadata
 *    - Small fonts (text-xs/text-sm)
 *    - Tight spacing (space-y-0.5)
 *
 * 2. ARTICLE VIEW - Main Article View (Right Content)
 *    - viewOptions.viewMode = "cards"
 *    - Full card display with all fields
 *    - Rich content, expandable sections
 *    - Normal fonts and spacing
 *
 * 3. SPLIT VIEW - Card List (Left Pane)
 *    - viewOptions.viewMode = "split"
 *    - Compact summary cards
 *    - Selection-focused UI
 *    - Click to edit in detail pane
 *
 * Features:
 * - Domain-controlled card rendering via EntityListCard (render prop)
 * - Domain-controlled group headers via EntityListGroupHeader (render prop)
 * - Domain-controlled list heading via EntityListHeading (render prop)
 * - Group collapse/expand controls
 * - Generic list behavior (keyboard nav, selection, loading states)
 * - Supports flat and grouped data structures
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
  onBulkDelete = null, // Add onBulkDelete prop for multi-select mass delete
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
  // Only trigger on actual navigation changes, not on re-renders
  // Skip in multi-select mode to prevent disrupting user's selection workflow
  useEffect(() => {
    // Don't reset scroll in multi-select mode - user is building a selection set
    if (externalViewOptions.selectionMode === "multi") {
      return;
    }

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
  }, [location.pathname, entityType, externalViewOptions.selectionMode]);

  // Auto-scroll to selected entity when it changes
  useEffect(() => {
    if (selectedEntityId && listContainerRef.current) {
      // Add a small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        // Don't scroll in multi-select mode - users are building a selection set, not navigating
        if (externalViewOptions.selectionMode === "multi") {
          return;
        }

        // Don't scroll if user is actively interacting with form elements (prevents disruption during inline editing)
        const activeElement = document.activeElement;
        const isInteractingWithForm =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "SELECT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.closest('[role="combobox"]') ||
            activeElement.closest('[role="listbox"]') ||
            activeElement.closest("[data-radix-select-trigger]") ||
            activeElement.closest("[data-radix-select-content]"));

        if (isInteractingWithForm) {
          return;
        }

        const selectedElement = listContainerRef.current?.querySelector(`[data-entity-id="${selectedEntityId}"]`);
        if (selectedElement) {
          selectedElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
          });
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedEntityId, externalViewOptions.selectionMode]);

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
  }, [selectedEntity?.__isNew, externalViewOptions.selectionMode]);

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
      const itemIds = (group.items || []).map((item) => item.id || item.renderId).join("-");
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
      const itemIds = (group.items || []).map((item) => item.id || item.renderId).join("-");
      const groupKey = `${entityType}-group-${group.group?.emne?.id || "no-emne"}-${groupIndex}-${itemIds.substring(0, 20)}`;
      return collapsedGroups.has(groupKey);
    });

  const handleEntitySelect = (entity, action) => {
    onEntitySelect?.(entity, action);
  };

  const handleEntityDoubleClick = (entity) => {
    onEntityDoubleClick?.(entity);
  };

  const isTOCMode = externalViewOptions.isTOCMode === true;

  // Ref for measuring header height
  const headerRef = React.useRef(null);
  const [headerHeight, setHeaderHeight] = React.useState(EntityListHeading ? 60 : 0); // Default 60px if heading exists, 0 otherwise

  // Scroll fade indicator state
  const [hasOverflow, setHasOverflow] = React.useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = React.useState(false);

  // Measure header height on mount and when it changes
  React.useEffect(() => {
    if (!EntityListHeading) {
      setHeaderHeight(0);
      return;
    }
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight;
      if (height !== headerHeight) {
        setHeaderHeight(height);
      }
    }
  }, [EntityListHeading, allItems.length, headerHeight]); // Re-measure when heading or items change

  // Check overflow and scroll position
  React.useEffect(() => {
    const checkOverflow = () => {
      if (listContainerRef.current) {
        const { scrollHeight, clientHeight } = listContainerRef.current;
        setHasOverflow(scrollHeight > clientHeight);
      }
    };

    const handleScroll = () => {
      if (listContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = listContainerRef.current;
        setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 1);
      }
    };

    checkOverflow();

    const scrollContainer = listContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [allItems.length, collapsedGroups]);

  // Conditional rendering for TOC mode (sticky header) vs. default mode (absolute header)
  if (isTOCMode) {
    return (
      <div className="relative h-full w-full bg-white flex flex-col">
        {/* Fixed Header for TOC Mode */}
        {EntityListHeading && (
          <div ref={headerRef} className="flex-shrink-0 z-40 bg-white">
            {(() => {
              const headingProps = {
                itemCount: allItems.length,
                hasGroups: hasGroupedData && groupedItems.length > 0,
                allGroupsExpanded: !allGroupsCollapsed,
                onToggleAllGroups: allGroupsCollapsed ? expandAll : collapseAll,
                entities: allItems,
                onBulkDelete: onBulkDelete,
                viewOptions: {
                  ...externalViewOptions,
                  viewMode: externalViewOptions.viewMode || "split",
                },
              };
              return EntityListHeading(headingProps);
            })()}
          </div>
        )}

        {/* Scrollable Content Area */}
        <div
          ref={listContainerRef}
          className="flex-1 overflow-y-auto pl-3"
          style={{ overscrollBehavior: "contain" }}
        >
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
            // Grouped rendering
            <div>
              {groupedItems.map((groupData, groupIndex) => {
                const itemIds = (groupData.items || []).map((item) => item.id || item.renderId).join("-");
                const groupKey = `${entityType}-group-${groupData.group.emne?.id || "no-emne"}-${groupIndex}-${itemIds.substring(0, 20)}`;
                const isCollapsed = collapsedGroups.has(groupKey);
                const groupItems = groupData.items;

                return (
                  <div key={groupKey}>
                    {EntityListGroupHeader &&
                      EntityListGroupHeader(groupData, {
                        isCollapsed,
                        onToggle: () => toggleGroupCollapse(groupKey),
                        itemCount: groupItems.length,
                        viewMode: isCardsMode ? "cards" : "split",
                        viewOptions: externalViewOptions,
                      })}
                    {!isCollapsed && (
                      <div className={isCardsMode ? "space-y-0.5 pr-2 pb-2" : ""}>
                        {groupItems.map((entity, index) => {
                          const relatedKravId = entity._relatedToKrav || entity.parentId || "";
                          const uniqueKey = relatedKravId
                            ? `${groupKey}-${entity.renderId}-related-${relatedKravId}`
                            : `${groupKey}-${entity.renderId}`;
                          return (
                            EntityListCard &&
                            EntityListCard(entity, {
                              key: uniqueKey,
                              "data-entity-id": entity.renderId,
                              isSelected: entity.renderId === selectedEntityId || `${groupKey}-${entity.renderId}` === selectedEntityId,
                              editMode:
                                entity.renderId === selectedEntityId &&
                                new URLSearchParams(window.location.search).get("editCard") === "true",
                              isFocused: focusedIndex === index,
                              onClick: handleEntitySelect,
                              onDoubleClick: handleEntityDoubleClick,
                              viewOptions: externalViewOptions,
                              onSave: onSave,
                            })
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat rendering
            <div className={isCardsMode ? "space-y-0.5 pr-2 pb-2" : ""}>
              {allItems.map((entity, index) => {
                const isFirstOccurrence = allItems.findIndex((e) => e.renderId === entity.renderId) === index;
                const isEntitySelected = entity.renderId === selectedEntityId;
                return (
                  EntityListCard &&
                  EntityListCard(entity, {
                    key: entity.renderId,
                    "data-entity-id": entity.renderId,
                    isSelected: isEntitySelected && isFirstOccurrence,
                    editMode:
                      entity.renderId === selectedEntityId && new URLSearchParams(window.location.search).get("editCard") === "true",
                    isFocused: focusedIndex === index,
                    onClick: handleEntitySelect,
                    onDoubleClick: handleEntityDoubleClick,
                    viewOptions: externalViewOptions,
                    onSave: onSave,
                  })
                );
              })}
            </div>
          )}
        </div>

        {/* Scroll fade indicator */}
        {hasOverflow && !isScrolledToBottom && (
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
        )}
      </div>
    );
  }

  // Default rendering with absolute positioning
  return (
    <div className="relative h-full bg-white">
      {/* Header - Absolutely positioned at top */}
      {EntityListHeading && (
        <div ref={headerRef} className="absolute top-0 left-0 right-0 z-40 bg-white">
          {(() => {
            const headingProps = {
              itemCount: allItems.length,
              hasGroups: hasGroupedData && groupedItems.length > 0,
              allGroupsExpanded: !allGroupsCollapsed,
              onToggleAllGroups: allGroupsCollapsed ? expandAll : collapseAll,
              // Multi-select support - pass entities and bulk delete handler
              entities: allItems,
              onBulkDelete: onBulkDelete, // Will be undefined if not provided
              viewOptions: {
                ...externalViewOptions,
                viewMode: externalViewOptions.viewMode || "split", // Explicitly ensure viewMode is set
              },
            };
            return EntityListHeading(headingProps);
          })()}
        </div>
      )}

      {/* Entity List - Absolutely positioned below header */}
      <div
        ref={listContainerRef}
        className="absolute left-0 right-0 bottom-0 overflow-y-auto pr-2"
        style={{ top: `${headerHeight}px`, overscrollBehavior: "contain" }}
      >
        <div>
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
                const itemIds = (groupData.items || []).map((item) => item.id || item.renderId).join("-");
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
                        viewMode: isCardsMode ? "cards" : "split",
                        viewOptions: externalViewOptions, // Pass viewOptions for TOC mode detection
                      })}

                    {/* Group items */}
                    {!isCollapsed && (
                      <div className={isCardsMode ? "space-y-0.5 pr-2 pb-2" : ""}>
                        {groupItems.map((entity, index) => {
                          // Create truly unique key using related krav context when available
                          // _relatedToKrav is a string number, not an object
                          const relatedKravId = entity._relatedToKrav || entity.parentId || "";
                          const uniqueKey = relatedKravId
                            ? `${groupKey}-${entity.renderId}-related-${relatedKravId}`
                            : `${groupKey}-${entity.renderId}`;

                          return (
                            EntityListCard &&
                            EntityListCard(entity, {
                              key: uniqueKey,
                              "data-entity-id": entity.renderId,
                              isSelected: entity.renderId === selectedEntityId || `${groupKey}-${entity.renderId}` === selectedEntityId,
                              editMode:
                                entity.renderId === selectedEntityId &&
                                new URLSearchParams(window.location.search).get("editCard") === "true",
                              isFocused: focusedIndex === index,
                              onClick: handleEntitySelect,
                              onDoubleClick: handleEntityDoubleClick,
                              viewOptions: externalViewOptions,
                              onSave: onSave, // Pass onSave to renderer
                            })
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            // Flat rendering (no emne groups)
            <div className={isCardsMode ? "space-y-0.5 pr-2 pb-2" : ""}>
              {allItems.map((entity, index) => {
                // For non-grouped view, only select first occurrence of duplicate entities
                const isFirstOccurrence = allItems.findIndex((e) => e.renderId === entity.renderId) === index;
                const isEntitySelected = entity.renderId === selectedEntityId;

                return (
                  EntityListCard &&
                  EntityListCard(entity, {
                    key: entity.renderId,
                    "data-entity-id": entity.renderId,
                    isSelected: isEntitySelected && isFirstOccurrence,
                    editMode:
                      entity.renderId === selectedEntityId && new URLSearchParams(window.location.search).get("editCard") === "true",
                    isFocused: focusedIndex === index,
                    onClick: handleEntitySelect,
                    onDoubleClick: handleEntityDoubleClick,
                    viewOptions: externalViewOptions,
                    onSave: onSave, // Pass onSave to renderer
                  })
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Scroll fade indicator - hide when scrolled to bottom */}
      {hasOverflow && !isScrolledToBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
      )}
    </div>
  );
};

export default EntityListPane;
