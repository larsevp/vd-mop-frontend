import React from "react";
import { createEntityInterface } from "../utils/EntityInterface.js";

/**
 * Generic Entity List Row Interface Component
 * 
 * Provides a standardized interface for displaying entity rows across different implementations.
 * Uses adapter pattern for proper entity naming and field resolution.
 * 
 * Interface Pattern:
 * - Unified props structure using EntityInterface
 * - Adapter-based field resolution  
 * - Configurable display options
 * - Support for combined views with proper entity type detection
 */
const GenericEntityListRow = ({
  entity,
  config,        // Unified config instead of separate modelConfig + entityType
  display = {},  // Unified display options
  actions = {},  // Unified action callbacks  
  context = {},  // Additional context (user, permissions, etc.)
  renderIcon,
}) => {
  // Extract configuration
  const { modelConfig, entityType } = config;
  const {
    isSelected = false,
    isFocused = false,
    viewOptions = {
      showHierarchy: true,
      showVurdering: true,
      showStatus: true,
      showPrioritet: true,
      showObligatorisk: true,
      showMerknad: true,
      showRelations: true,
    }
  } = display;
  
  const { onClick, onFocus } = actions;

  // Create EntityInterface for adapter-based operations
  const entityInterface = createEntityInterface(entityType, { modelConfig });

  // Helper utilities
  const truncateText = (text, maxLength = 60) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "..";
  };

  // For combined views, detect the actual entity type and create appropriate interface
  const actualEntityType = entityInterface.resolveEntityType(entity);
  const actualEntityInterface = actualEntityType !== entityType 
    ? createEntityInterface(actualEntityType, { modelConfig: entityInterface.modelConfig })
    : entityInterface;

  // Use adapter to transform entity for display
  const transformedEntity = actualEntityInterface.transformEntityForDisplay(entity);

  // Build display data using adapter transformations
  const buildDisplayData = () => {
    if (!transformedEntity) {
      return {
        title: "",
        uid: `ID-${entity.id || "unknown"}`,
        description: "",
        status: "",
        vurdering: "",
        emne: "",
        prioritet: null,
        obligatorisk: false,
      };
    }

    return {
      title: transformedEntity.title || "",
      uid: transformedEntity.uid || `ID-${entity.id}`,
      description: truncateText(transformedEntity.description || ""),
      status: transformedEntity.status?.name || transformedEntity.status?.navn || "",
      vurdering: transformedEntity.vurdering?.name || transformedEntity.vurdering?.navn || "",
      emne: transformedEntity.emne?.title || transformedEntity.emne?.tittel || "",
      prioritet: transformedEntity.prioritet,
      obligatorisk: transformedEntity.obligatorisk,
      entityTypeDisplay: actualEntityInterface.getEntityTypeDisplayName(),
    };
  };

  const displayData = buildDisplayData();

  // Render component
  return (
    <div
      className={`
        entity-list-row cursor-pointer p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors
        ${isSelected ? "bg-blue-50 border-blue-200" : ""}
        ${isFocused ? "ring-2 ring-blue-300" : ""}
      `}
      onClick={() => onClick?.(entity)}
      onFocus={() => onFocus?.(entity)}
      tabIndex={0}
    >
      {/* Line 1: [Code] Title • Category + Status */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          {renderIcon && renderIcon(entity)}
          <span className="text-xs text-gray-500 font-mono">
            [{displayData.uid}]
          </span>
          <span className="font-medium text-gray-900 truncate">
            {displayData.title}
          </span>
          {displayData.emne && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">{displayData.emne}</span>
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {viewOptions.showStatus && displayData.status && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {displayData.status}
            </span>
          )}
        </div>
      </div>

      {/* Line 2: Description preview + Status indicators */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 truncate flex-1">
          {displayData.description}
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          {viewOptions.showVurdering && displayData.vurdering && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
              {displayData.vurdering}
            </span>
          )}
          {viewOptions.showPrioritet && displayData.prioritet && (
            <span className="text-xs text-gray-500">
              P{displayData.prioritet}
            </span>
          )}
          {viewOptions.showObligatorisk && displayData.obligatorisk && (
            <span className="text-xs text-red-600">●</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenericEntityListRow;