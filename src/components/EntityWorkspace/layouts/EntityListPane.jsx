import React, { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, ChevronRight, FileText } from "lucide-react";
import EntityListRow from "./EntityListRow";
import EntityListViewOptions from "../shared/EntityListViewOptions";

/**
 * Clean, minimal left pane for entity list
 * Features:
 * - Integrated search and filters
 * - Two-line entity rows
 * - Keyboard navigation
 * - Clean, scannable design
 */
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

  // Use items directly - backend provides properly grouped data
  const groupedItems = items || [];

  // Flatten for keyboard navigation - build with proper indexing
  const allItems = useMemo(() => {
    const flattened = [];
    groupedItems.forEach((group) => {
      const groupItems = group[entityType] || group.tiltak || group.krav || [];
      flattened.push(...groupItems);
    });
    return flattened;
  }, [groupedItems, entityType]);

  // Create a mapping from entity ID to flat index for consistent focus
  const entityIndexMap = useMemo(() => {
    const map = new Map();
    allItems.forEach((item, index) => {
      map.set(item.id, index);
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

  // Auto-scroll focused item into view
  useEffect(() => {
    if (listRef.current && focusedIndex >= 0) {
      const focusedElement = listRef.current.children[focusedIndex + 1]; // +1 for header
      if (focusedElement) {
        focusedElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [focusedIndex]);

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
            const groupItems = group[entityType] || group.tiltak || group.krav || [];

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
                    const globalIndex = entityIndexMap.get(entity.id) ?? -1;
                    const entityKey = entity.id || `${entityType}-${index}-${group.emne?.id || "no-emne"}`;
                    return (
                      <EntityListRow
                        key={entityKey}
                        entity={entity}
                        modelConfig={modelConfig}
                        entityType={entityType}
                        isSelected={entity.id?.toString() === selectedEntityId?.toString()}
                        isFocused={globalIndex === focusedIndex}
                        onClick={() => onEntitySelect(entity)}
                        onFocus={(index) => setFocusedIndex(typeof index === 'number' ? index : globalIndex)}
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
