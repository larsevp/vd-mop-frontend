import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { EntityTypeTranslator } from "../utils/entityTypeTranslator";
import EntityListPane from "../components/EntityList/EntityListPane";
import EntityDetailPane from "../components/EntityDetail/EntityDetailPane";
import useEntityWorkspaceStore from "../stores/entityWorkspaceStore";

/**
 * Master-Detail Split View Layout
 * Left pane: Compact list of entities
 * Right pane: Detailed view of selected entity
 *
 * Features:
 * - URL deep-linking to specific entities
 * - Integrated search and filtering
 * - Keyboard navigation
 * - Responsive mobile behavior
 */
const EntitySplitView = ({
  items,
  modelConfig,
  entityType,
  config,
  searchQuery,
  filterBy,
  sortBy,
  sortOrder,
  searchInput,
  onSearchInputChange,
  onSearch,
  onClearSearch,
  onFilterChange,
  onSortChange,
  onSortOrderChange,
  // New props for EntityFilters
  viewMode,
  onViewModeChange,
  additionalFilters,
  onAdditionalFiltersChange,
  availableStatuses,
  availableVurderinger,
  isLoading,
  isFetching,
  onCreateNew,
  onSave,
  onDelete,
  renderIcon,
  user,
  // Split view specific props
  activeEntity, // External entity to display (e.g., for new entity creation)
  setActiveEntity, // Function to clear/set active entity
  listWidth = "35%",
  enableKeyboardNav = true,
}) => {
  const navigate = useNavigate();
  const params = useParams();

  // Get selectedEntity from store
  const selectedEntity = useEntityWorkspaceStore((state) => state.selectedEntity);
  const clearJustCreatedFlag = useEntityWorkspaceStore((state) => state.clearJustCreatedFlag);

  // Selected entity state - synced with URL and store
  const [selectedEntityId, setSelectedEntityId] = useState(params.entityId || null);

  // Collapsible panel state - persistent with localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem(`${entityType}-listPaneCollapsed`);
    return saved ? JSON.parse(saved) : false;
  });

  // Resizable width state - persistent with localStorage
  const [panelWidth, setPanelWidth] = useState(() => {
    const saved = localStorage.getItem(`${entityType}-listPaneWidth`);
    // Ensure we have a reasonable default and validate saved value
    if (saved) {
      const parsedWidth = parseFloat(saved);
      // If it's a reasonable pixel value, use it; otherwise reset to default
      if (saved.includes("px") && parsedWidth >= 200 && parsedWidth <= 500) {
        return saved;
      }
      // If it's a percentage, convert to reasonable pixel default
      if (saved.includes("%") && parsedWidth > 0 && parsedWidth <= 50) {
        return "350px"; // Reasonable default
      }
    }
    // Fallback to reasonable pixel default
    return "350px";
  });

  // Drag state for resizing
  const [isDragging, setIsDragging] = useState(false);

  // Ref for the left panel to avoid DOM traversal issues
  const leftPanelRef = useRef(null);

  // Map entityType to the actual property name in grouped data (same as EntityFilterService and EntityListPane)
  const getGroupedDataPropertyName = (entityType) => {
    return EntityTypeTranslator.translate(entityType, "lowercase");
  };

  // Flatten items if they're grouped (for compatibility with grouped data)
  const flatItems = useMemo(() => {
    if (!items.length) return [];

    // Check if we have grouped data (items contain emne and entity arrays)
    const firstItem = items[0];
    const propertyName = getGroupedDataPropertyName(entityType);

    if (firstItem.emne && (firstItem[propertyName] || firstItem[entityType] || firstItem.entities || firstItem.krav || firstItem.tiltak)) {
      // Flatten grouped data
      const flattened = [];
      items.forEach((group) => {
        const entities = group[propertyName] || group[entityType] || group.entities || group.krav || group.tiltak || [];
        entities.forEach((entity) => {
          // Attach emne info for display
          entity.emne = group.emne;
          flattened.push(entity);
        });
      });
      return flattened;
    }

    // Already flat data
    return items;
  }, [items, entityType]);

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

  // Determine which entity to display
  // Priority: activeEntity (external) > selectedEntity (from URL/internal state)
  const displayEntity =
    activeEntity ||
    flatItems.find((item) => {
      const itemUniqueId = generateUniqueEntityId(item);
      return itemUniqueId === selectedEntityId?.toString();
    });

  // Debug logging (can be removed in production)
  // EntitySplitView DEBUG - flatItems, selectedEntityId, activeEntity, displayEntity

  // Update URL when selection changes (but not if it came from URL)
  useEffect(() => {
    const currentPath = window.location.pathname;
    const expectedPath = selectedEntityId ? `/${entityType}-workspace/${selectedEntityId}` : `/${entityType}-workspace`;

    if (currentPath !== expectedPath) {
      // EntitySplitView DEBUG - navigating to: expectedPath
      navigate(expectedPath, {
        replace: true,
        preventScrollReset: true, // Prevent scroll to top on navigation
      });
    }
  }, [selectedEntityId, entityType, navigate]);

  // Sync with store's selectedEntity (for new entity creation)
  useEffect(() => {
    if (selectedEntity) {
      const entityUniqueId = generateUniqueEntityId(selectedEntity);

      if (entityUniqueId !== selectedEntityId) {
        setSelectedEntityId(entityUniqueId);
      }
    }
  }, [selectedEntity]);

  // Sync with URL params changes
  useEffect(() => {
    const urlEntityId = params.entityId || null;
    if (urlEntityId !== selectedEntityId) {
      setSelectedEntityId(urlEntityId);
    }
  }, [params.entityId]);

  const handleEntitySelect = (entity) => {
    // EntitySplitView DEBUG - entity selected: entity
    // Use compound ID for combined views to avoid conflicts, including relationship context
    const uniqueId = generateUniqueEntityId(entity);
    setSelectedEntityId(uniqueId);

    // Update activeEntity so the detail view refreshes immediately
    if (setActiveEntity) {
      setActiveEntity(entity);
    }

    // Only clear the "just created" flag if this is truly a manual selection from the list
    // Don't clear it if this entity selection is coming from the store sync (i.e., entity creation)
    if (entity.id !== selectedEntity?.id) {
      clearJustCreatedFlag();
    }
  };

  const handleEntityDeselect = () => {
    setSelectedEntityId(null);

    // Also clear activeEntity if it's create-new
    if (setActiveEntity && activeEntity?.id === "create-new") {
      setActiveEntity(null);
    }
  };

  // Toggle collapse state
  const handleToggleCollapse = useCallback(() => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    localStorage.setItem(`${entityType}-listPaneCollapsed`, JSON.stringify(newCollapsed));
  }, [isCollapsed, entityType]);

  // Handle resizer drag
  const handleMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Use ref instead of DOM traversal
      if (!leftPanelRef.current) {
        console.error("Left panel ref not available");
        return;
      }

      setIsDragging(true);
      const startX = e.clientX;
      const startWidth = leftPanelRef.current.offsetWidth;
      let animationId = null;

      const handleMouseMove = (moveEvent) => {
        moveEvent.preventDefault();

        // Cancel previous animation frame if still pending
        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        // Use requestAnimationFrame for smooth 60fps updates
        animationId = requestAnimationFrame(() => {
          const diff = moveEvent.clientX - startX;
          let newWidth = startWidth + diff;

          // Simple constraints: min 200px, max 500px
          newWidth = Math.max(200, Math.min(newWidth, 500));

          // Direct DOM manipulation for performance - no React re-renders during drag
          if (leftPanelRef.current) {
            leftPanelRef.current.style.width = `${newWidth}px`;
          }
        });
      };

      const handleMouseUp = () => {
        // Clean up animation frame
        if (animationId) {
          cancelAnimationFrame(animationId);
        }

        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        // Sync final width back to React state
        if (leftPanelRef.current) {
          const finalWidth = leftPanelRef.current.style.width;
          setPanelWidth(finalWidth);
          localStorage.setItem(`${entityType}-listPaneWidth`, finalWidth);
        }
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [panelWidth, entityType]
  );

  // Save width changes to localStorage (only save valid values)
  useEffect(() => {
    const parsedWidth = parseFloat(panelWidth);
    if (panelWidth.includes("px") && parsedWidth >= 200 && parsedWidth <= 500) {
      localStorage.setItem(`${entityType}-listPaneWidth`, panelWidth);
    }
  }, [panelWidth, entityType]);

  // Clean up any invalid localStorage data on mount
  useEffect(() => {
    const saved = localStorage.getItem(`${entityType}-listPaneWidth`);
    if (saved) {
      const parsedWidth = parseFloat(saved);
      // If saved value is invalid, remove it
      if (saved.includes("%") || parsedWidth < 200 || parsedWidth > 500) {
        localStorage.removeItem(`${entityType}-listPaneWidth`);
      }
    }
  }, [entityType]);

  return (
    <div className={`flex bg-gray-50 ${isDragging ? "select-none" : ""}`} style={{ height: "calc(100vh - 80px)" }}>
      {/* Left Pane - Entity List */}
      <div
        ref={leftPanelRef}
        className={`flex-shrink-0 bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 ${
          isCollapsed ? "w-0" : ""
        }`}
        style={{ width: isCollapsed ? 0 : panelWidth }}
      >
        {!isCollapsed && (
          <div className="flex flex-col h-full">
            {/* Entity list - takes full space */}
            <div className="flex-1 overflow-hidden">
              <EntityListPane
                items={items}
                modelConfig={modelConfig}
                entityType={entityType}
                config={config}
                selectedEntityId={selectedEntityId}
                onEntitySelect={handleEntitySelect}
                searchQuery={searchQuery}
                isLoading={isLoading}
                isFetching={isFetching}
                enableKeyboardNav={enableKeyboardNav}
                renderIcon={renderIcon}
              />
            </div>
          </div>
        )}
      </div>

      {/* Resizer and Collapse Toggle */}
      <div className="relative flex items-center group px-2">
        {/* Resizer handle */}
        {!isCollapsed && (
          <div
            className={`w-2 bg-gray-200 hover:bg-blue-300 cursor-col-resize flex items-center justify-center transition-colors select-none ${
              isDragging ? "bg-blue-400 w-3" : ""
            }`}
            style={{ height: "calc(100vh - 80px)" }}
            onMouseDown={handleMouseDown}
          >
            <GripVertical className={`text-gray-400 ${isDragging ? "text-blue-600" : ""}`} size={14} />
          </div>
        )}

        {/* Collapse/Expand button - only visible on hover */}
        <button
          onClick={handleToggleCollapse}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:shadow-md hover:bg-gray-50 transition-all opacity-0 group-hover:opacity-100"
          title={isCollapsed ? "Vis liste" : "Skjul liste"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4 text-gray-600" /> : <ChevronLeft className="w-4 h-4 text-gray-600" />}
        </button>
      </div>

      {/* Right Pane - Detail View */}
      <div className="flex-1 overflow-hidden">
        {displayEntity ? (
          <EntityDetailPane
            entity={displayEntity}
            modelConfig={modelConfig}
            entityType={entityType}
            config={config}
            onSave={onSave}
            onDelete={onDelete}
            onClose={handleEntityDeselect}
            renderIcon={renderIcon}
            user={user}
          />
        ) : (
          // Empty state when no entity selected
          <div className="flex items-center justify-center h-full text-gray-500 bg-white">
            <div className="text-center max-w-md px-6">
              <div className="mb-6">{renderIcon("FileText", 64) || <div className="w-16 h-16 bg-gray-200 rounded mx-auto"></div>}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Velg {modelConfig.title?.toLowerCase() || entityType} for å se detaljer
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Klikk på et element i listen til venstre for å vise detaljert informasjon, eller bruk søkefunksjonen for å finne spesifikke
                elementer.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EntitySplitView;