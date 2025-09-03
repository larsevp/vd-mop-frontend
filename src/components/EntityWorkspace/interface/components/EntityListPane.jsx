import React, { useState, useRef, useEffect, useMemo } from "react";
import { Loader2, ChevronDown, ChevronRight, FileText, Minimize2, Maximize2, Settings } from "lucide-react";
import SearchBar from "./SearchBar";

/**
 * EntityListPane with proper header and row design (copied from main branch)
 * Features:
 * - Integrated search bar in header
 * - Group collapse/expand controls
 * - Two-line entity rows
 * - View options menu
 * - Clean, scannable design
 */
const EntityListPane = ({
  entities = [],
  entityType,
  selectedEntity,
  onEntitySelect,
  searchInput = "",
  onSearchInputChange,
  onSearch,
  onClearSearch,
  filterBy = "all",
  sortBy = "updatedAt",
  sortOrder = "desc",
  onFilterChange,
  onSortChange,
  onSortOrderChange,
  additionalFilters = {},
  onAdditionalFiltersChange,
  availableStatuses = [],
  availableVurderinger = [],
  isLoading = false,
  isFetching = false,
  onCreateNew,
  modelConfig,
  enableKeyboardNav = true,
  // NEW: Adapter for domain-specific logic
  adapter = null,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  const [viewOptions, setViewOptions] = useState({
    showHierarchy: true,
    showVurdering: false,
    showStatus: false,
    showPrioritet: false,
    showObligatorisk: true,
    showMerknad: false,
    showRelations: true,
  });
  const [showViewOptions, setShowViewOptions] = useState(false);

  // Generate unique entity ID for selection tracking
  const generateUniqueEntityId = (entity) => {
    if (entity.entityType) {
      return `${entity.entityType.toLowerCase()}-${entity.id}`;
    }
    return entity.id?.toString();
  };

  // Get selected entity ID
  const selectedEntityId = selectedEntity ? generateUniqueEntityId(selectedEntity) : null;

  // Handle entity selection
  const handleEntitySelect = (entity) => {
    onEntitySelect?.(entity);
  };

  // Simple truncate function
  const truncateText = (text, maxLength = 60) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Extract UID from entity using adapter
  const getEntityUID = (entity) => {
    if (adapter && adapter.extractUID) {
      return adapter.extractUID(entity);
    }
    // Fallback for legacy compatibility
    return entity.uid || entity.kravUID || entity.tiltakUID || entity.id;
  };

  // Extract text from TipTap JSON
  const extractTextFromTipTap = (tipTapObj) => {
    if (!tipTapObj) return "";
    if (typeof tipTapObj === "string") return tipTapObj;
    if (typeof tipTapObj !== "object") return "";
    
    let text = "";
    if (tipTapObj.content && Array.isArray(tipTapObj.content)) {
      tipTapObj.content.forEach(node => {
        if (node.type === "paragraph" && node.content) {
          node.content.forEach(textNode => {
            if (textNode.type === "text" && textNode.text) {
              text += textNode.text + " ";
            }
          });
        }
      });
    }
    return text.trim();
  };

  // Entity Row Component
  const EntityRow = ({ entity, isSelected, isFocused, onClick }) => {
    const uid = getEntityUID(entity);
    const title = entity.tittel || entity.navn || "Uten tittel";
    
    // Get description 
    let description = "";
    if (entity.beskrivelseSnippet) {
      description = entity.beskrivelseSnippet;
    } else if (entity.beskrivelse) {
      description = extractTextFromTipTap(entity.beskrivelse);
    }

    return (
      <div
        className={`px-3 py-2 border-b border-gray-100 cursor-pointer transition-colors duration-150 ${
          isSelected ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
        } ${isFocused ? "ring-1 ring-blue-300" : ""}`}
        onClick={() => onClick(entity)}
      >
        {/* Line 1: UID + Title + Entity Type Badge */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {uid && (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                {uid}
              </span>
            )}
            <span className="font-medium text-gray-900 truncate">{title}</span>
            {entity.entityType && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                adapter && adapter.getBadgeColor 
                  ? adapter.getBadgeColor(entity.entityType)
                  : 'bg-gray-100 text-gray-700' // Generic fallback
              }`}>
                {adapter && adapter.getDisplayType 
                  ? adapter.getDisplayType(entity.entityType)
                  : entity.entityType
                }
              </span>
            )}
          </div>
        </div>

        {/* Line 2: Description + Status indicators */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 truncate flex-1">
            {truncateText(description, 80)}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {viewOptions.showStatus && entity.status && (
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                {entity.status.navn || entity.status}
              </span>
            )}
            {viewOptions.showVurdering && entity.vurdering && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                {entity.vurdering.navn || entity.vurdering}
              </span>
            )}
          </div>
        </div>

        {/* Line 3: Footer with emne + updated */}
        {entity.emne && (
          <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
            <span>{entity.emne.navn || entity.emne.name}</span>
            <span>Oppdatert {new Date(entity.updatedAt).toLocaleDateString('no-NO')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 bg-gray-50">
        {/* Search Bar */}
        <SearchBar
          searchInput={searchInput}
          onSearchInputChange={onSearchInputChange}
          onSearch={onSearch}
          onClearSearch={onClearSearch}
          isLoading={isLoading}
          placeholder="Søk..."
          mode="advanced"
          filterBy={filterBy}
          onFilterChange={onFilterChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          onSortOrderChange={onSortOrderChange}
          entityType={entityType}
          additionalFilters={additionalFilters}
          onAdditionalFiltersChange={onAdditionalFiltersChange}
          availableStatuses={availableStatuses}
          availableVurderinger={availableVurderinger}
        />

        {/* Controls row */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {entities.length} {entities.length === 1 ? 'element' : 'elementer'}
            </span>
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Collapse/Expand All */}
            {collapsedGroups.size > 0 ? (
              <button
                onClick={() => setCollapsedGroups(new Set())}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Utvid alle"
              >
                <Maximize2 className="w-3 h-3" />
                Utvid alle
              </button>
            ) : (
              <button
                onClick={() => setCollapsedGroups(new Set(['all']))}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Skjul alle"
              >
                <Minimize2 className="w-3 h-3" />
                Skjul alle
              </button>
            )}

            {/* View Options */}
            <div className="relative">
              <button
                onClick={() => setShowViewOptions(!showViewOptions)}
                className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                title="Visningsalternativer"
              >
                <Settings className="w-3 h-3" />
              </button>
              
              {showViewOptions && (
                <div className="absolute top-full right-0 mt-1 p-2 bg-white rounded border shadow-lg z-50 w-48">
                  <div className="text-xs font-medium text-gray-700 mb-2">Vis i rader</div>
                  {Object.entries(viewOptions).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 text-xs py-1">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setViewOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-3 h-3"
                      />
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Entity List */}
      <div className="flex-1 overflow-y-auto">
        {entities.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">
                {isLoading ? "Laster..." : searchInput ? "Ingen treff" : "Ingen elementer"}
              </p>
            </div>
          </div>
        ) : (
          <div>
            {entities.map((entity, index) => (
              <EntityRow
                key={generateUniqueEntityId(entity)}
                entity={entity}
                isSelected={generateUniqueEntityId(entity) === selectedEntityId}
                isFocused={focusedIndex === index}
                onClick={handleEntitySelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityListPane;