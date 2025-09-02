import React from "react";
import { createEntityInterface } from "../utils/EntityInterface.js";

/**
 * Generic Entity Detail Pane Interface Component
 * 
 * Provides a standardized interface for entity detail views across different implementations.
 * Uses adapter pattern for proper entity naming and field resolution.
 * 
 * Interface Pattern:
 * - Unified props structure using EntityInterface
 * - Adapter-based field resolution
 * - Dynamic form handling
 * - Configurable actions
 * - Context-aware permissions
 */
const GenericEntityDetailPane = ({
  entity,
  config,        // Unified config instead of separate modelConfig + entityType
  actions = {},  // Unified action callbacks (onSave, onDelete, onClose)
  context = {},  // Additional context (user, permissions, etc.)
  mode = 'view', // 'view' | 'edit' | 'create'
  renderIcon,
}) => {
  // Extract configuration
  const { modelConfig, entityType } = config;
  const { onSave, onDelete, onClose } = actions;
  const { user, permissions = {} } = context;

  // Create EntityInterface for adapter-based operations
  const entityInterface = createEntityInterface(entityType, { modelConfig });

  // Determine if this is a new entity
  const isNewEntity = entity?.id === "create-new" || mode === 'create';
  const isEditMode = mode === 'edit' || isNewEntity;

  // For combined views, detect the actual entity type and create appropriate interface
  const actualEntityType = entityInterface.resolveEntityType(entity);
  const actualEntityInterface = actualEntityType !== entityType 
    ? createEntityInterface(actualEntityType, { modelConfig: entityInterface.modelConfig })
    : entityInterface;

  // Use adapter to transform entity for display
  const transformedEntity = actualEntityInterface.transformEntityForDisplay(entity);

  // Build display data using adapter transformations
  const buildDisplayData = () => {
    if (isNewEntity) {
      return {
        title: `New ${actualEntityInterface.getEntityTypeDisplayName()}`,
        uid: "NEW",
        entityType: actualEntityInterface.getEntityTypeDisplayName(),
        actualEntityType: actualEntityType
      };
    }

    if (!transformedEntity) {
      return {
        title: `${actualEntityInterface.getEntityTypeDisplayName()}`,
        uid: `ID-${entity?.id || "unknown"}`,
        entityType: actualEntityInterface.getEntityTypeDisplayName(),
        actualEntityType: actualEntityType
      };
    }

    return {
      title: transformedEntity.title || "",
      uid: transformedEntity.uid || `ID-${entity?.id}`,
      entityType: actualEntityInterface.getEntityTypeDisplayName(),
      actualEntityType: actualEntityType,
      transformedEntity
    };
  };

  const displayData = buildDisplayData();

  // Permission checks
  const canEdit = permissions.canEdit !== false && !isNewEntity;
  const canDelete = permissions.canDelete !== false && !isNewEntity;
  const canSave = permissions.canSave !== false;

  // Render header
  const renderHeader = () => (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {renderIcon && renderIcon(entity)}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {displayData.title}
            </h2>
            <p className="text-sm text-gray-500">
              [{displayData.uid}] • {displayData.entityType}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isEditMode && canEdit && (
            <button
              onClick={() => actions.onEdit?.(entity)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit
            </button>
          )}
          
          {!isEditMode && canDelete && (
            <button
              onClick={() => onDelete?.(entity)}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
          
          {isEditMode && (
            <>
              <button
                onClick={() => onSave?.(entity)}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                disabled={!canSave}
              >
                {isNewEntity ? 'Create' : 'Save'}
              </button>
              <button
                onClick={() => onClose?.()}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </>
          )}
          
          <button
            onClick={() => onClose?.()}
            className="p-2 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );

  // Render content based on mode
  const renderContent = () => {
    if (isEditMode) {
      return (
        <div className="p-4">
          <div className="space-y-4">
            {/* Placeholder for form fields - would be replaced by implementation */}
            <div className="text-center py-8 text-gray-500">
              <p>Entity form fields would be rendered here</p>
              <p className="text-sm mt-2">
                Implementation-specific form component should be passed as children or via config
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="space-y-4">
          {/* View mode - display transformed entity data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {transformedEntity && Object.entries(transformedEntity).map(([key, value]) => {
              if (key.startsWith('_') || key === 'id') return null;
              
              // Handle special display for certain fields
              const displayValue = () => {
                if (key === 'status' || key === 'vurdering' || key === 'emne') {
                  return typeof value === 'object' && value !== null 
                    ? (value.name || value.navn || value.title || value.tittel || JSON.stringify(value))
                    : String(value || '');
                }
                
                if (typeof value === 'object' && value !== null) {
                  return JSON.stringify(value, null, 2);
                }
                
                return String(value || '');
              };
              
              return (
                <div key={key} className="border-b border-gray-100 pb-2">
                  <dt className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {displayValue()}
                  </dd>
                </div>
              );
            })}
            
            {/* Fallback if no transformed entity */}
            {!transformedEntity && entity && Object.entries(entity).map(([key, value]) => {
              if (key.startsWith('_') || key === 'id') return null;
              
              return (
                <div key={key} className="border-b border-gray-100 pb-2">
                  <dt className="text-sm font-medium text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </dt>
                  <dd className="text-sm text-gray-900 mt-1">
                    {typeof value === 'object' && value !== null 
                      ? JSON.stringify(value, null, 2)
                      : String(value || '')
                    }
                  </dd>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {renderHeader()}
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default GenericEntityDetailPane;