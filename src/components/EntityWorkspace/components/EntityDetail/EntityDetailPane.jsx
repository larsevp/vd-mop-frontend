import React, { useState, useEffect, useMemo, useRef } from "react";
import { Edit, X, ChevronDown, ChevronRight, Save, RotateCcw, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import EntityDetailForm from "./EntityDetailForm";
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";
import { modelConfigs } from "@/modelConfigs";
import { EntityTypeResolver } from "@/components/EntityWorkspace/services/EntityTypeResolver";
import { useEditingActions } from "@/stores/editingStateStore";
import useEntityWorkspaceStore from "../../stores/entityWorkspaceStore";

/**
 * Clean, minimal detail pane for selected entity
 * Features:
 * - Sticky header with title and actions
 * - Uses RowForm logic with EntityDetailPane-specific overrides
 * - Progressive disclosure with accordions
 * - Keyboard shortcuts: 'e' for edit, 'esc' for cancel
 */
const EntityDetailPane = ({ entity, modelConfig, entityType, config, onSave, onDelete, onClose, renderIcon, user }) => {
  // Get store actions for setting the isEntityJustCreated flag
  const setSelectedEntity = useEntityWorkspaceStore((state) => state.setSelectedEntity);
  const setActiveEntity = useEntityWorkspaceStore((state) => state.setActiveEntity);
  const clearJustCreatedFlag = useEntityWorkspaceStore((state) => state.clearJustCreatedFlag);

  // We need to access the store directly to set the flag
  const store = useEntityWorkspaceStore.getState();
  // Check if this is a new entity being created
  const isNewEntity = entity?.id === "create-new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Ref for the detail view container to enable scrolling
  const detailViewRef = useRef(null);

  // Scroll to top when creating a new entity
  useEffect(() => {
    if (isNewEntity && detailViewRef.current) {
      detailViewRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, [isNewEntity]);

  // Helper function to scroll detail view to top
  const scrollToTop = () => {
    // Use setTimeout to ensure state updates are processed first
    setTimeout(() => {
      if (detailViewRef.current) {
        detailViewRef.current.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, 10);
  };

  // Dynamically resolve the correct model config for combined entities
  const resolvedModelConfig = useMemo(() => {
    if (entity?.entityType && entity.entityType !== entityType) {
      // This is a combined entity with a different type - use EntityTypeResolver
      const resolvedConfig = EntityTypeResolver.resolveModelConfig(entity.entityType);

      // EntityDetailPane - Resolving config for combined entity: entityType, originalEntityType, resolvedConfig

      if (resolvedConfig && resolvedConfig !== EntityTypeResolver._createFallbackConfig(entity.entityType)) {
        return resolvedConfig;
      }
    }
    // Fall back to the provided modelConfig
    return modelConfig;
  }, [entity, modelConfig, entityType]);

  // Use the entity's actual type for field operations
  const resolvedEntityType = entity?.entityType || entityType;

  // Also resolve the workspace config
  const resolvedConfig = useMemo(() => {
    if (entity?.entityType && entity.entityType !== entityType) {
      // Use the resolved model config's workspace settings
      return {
        ...config,
        ...resolvedModelConfig.workspace,
        detailForm: resolvedModelConfig.workspace?.detailForm || config.detailForm || {},
      };
    }
    return config;
  }, [entity, config, resolvedModelConfig, entityType]);

  // Get display field names early (needed by actionPermissions)
  const titleField =
    resolvedModelConfig.workspace?.cardFields?.find((f) => f === "tittel" || f === "title" || f === "navn" || f === "name") || "tittel";

  const uidField = resolvedModelConfig.workspace?.cardFields?.find((f) => f.toLowerCase().includes("uid"));

  // Action permissions resolver - controls what actions are available
  const actionPermissions = useMemo(() => {
    const permissions = {
      canEdit: true,
      canDelete: true,
      canCreate: true,
      editButtonText: "Rediger",
      createButtonText: `Nytt ${resolvedEntityType}`,
      deleteConfirmText: `Er du sikker på at du vil slette "${entity?.[titleField] || "denne oppføringen"}"?`,
    };

    // For combined views, check if editing/creating is disabled
    if (entityType === "combinedEntities" || entityType === "combined") {
      // In combined view, we might want to disable creating since it's ambiguous
      permissions.canCreate = false;

      // For specific entity types within combined view, check their individual capabilities
      if (entity?.entityType) {
        const targetConfig = EntityTypeResolver.resolveModelConfig(entity.entityType);

        if (targetConfig && targetConfig !== EntityTypeResolver._createFallbackConfig(entity.entityType)) {
          // Check if the target model allows editing
          permissions.canEdit = targetConfig.workspace?.features?.inlineEdit !== false;
          permissions.editButtonText = `Rediger ${targetConfig.title || entity.entityType}`;
          permissions.deleteConfirmText = `Er du sikker på at du vil slette "${entity?.[titleField] || "denne oppføringen"}"?`;
        }
      }
    }

    // Check workspace features
    if (resolvedConfig.features?.inlineEdit === false) {
      permissions.canEdit = false;
    }

    // Check if entity is read-only based on model config
    if (resolvedModelConfig.readOnly) {
      permissions.canEdit = false;
      permissions.canDelete = false;
      permissions.canCreate = false;
    }

    // EntityDetailPane - Action permissions: entityType, resolvedEntityType, entityEntityType, permissions

    return permissions;
  }, [entity, entityType, resolvedEntityType, resolvedConfig, resolvedModelConfig, titleField]);

  const [isEditing, setIsEditing] = useState(isNewEntity);
  const [editData, setEditData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({});

  // Get the store initialization function

  // Get editing state actions from store
  const { setEntityEditing } = useEditingActions();

  // Initialize edit data when entity changes
  useEffect(() => {
    if (entity) {
      // Initialize store for this specific entity (surgical reset only when switching entities)

      // For new entities, start in edit mode; for existing entities, start in view mode
      const shouldEdit = isNewEntity;
      setIsEditing(shouldEdit);
      setEntityEditing(entity.id, shouldEdit);

      // Initialize only with fields that can be edited (not hidden, computed, or relationship fields)
      const initialData = {};
      resolvedModelConfig.fields.forEach((field) => {
        // Exclude fields that shouldn't be sent to backend:
        // - Hidden fields (hiddenEdit, hiddenCreate)
        // - Virtual/computed fields (snippet fields, etc.)
        // - Relationship fields (handled separately)
        // - System fields (id, timestamps, audit fields)
        const isHidden = field.hiddenEdit || field.hiddenCreate;
        const isVirtual = field.name.includes("Snippet") || field.name.includes("Plain");
        const isRelationship = ["krav", "files", "favorittTiltak", "favorittAvBrukere", "children", "parent"].includes(field.name);
        const isSystemField = ["id", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(field.name);
        const isEntityReference = field.name.endsWith("Id") && field.type.includes("select"); // emneId, statusId, etc. are OK

        if (!isHidden && !isVirtual && !isRelationship && !isSystemField) {
          // Use FieldResolver to get proper initial values including defaults
          initialData[field.name] = FieldResolver.initializeFieldValue(field, entity, !isNewEntity, resolvedEntityType);
        }
      });
      setEditData(initialData);
      setHasChanges(false);
      setErrors({});
    }
  }, [entity?.id, isNewEntity, resolvedModelConfig, resolvedEntityType, setEntityEditing]);

  // Get display values
  const title = entity[titleField] || "Uten tittel";
  const uid = uidField ? entity[uidField] : `${resolvedEntityType.toUpperCase()}${entity.id}`;

  const handleFieldChange = (fieldName, value) => {
    setEditData((prev) => ({ ...prev, [fieldName]: value }));
    setHasChanges(true);

    // Clear error for this field when user makes changes
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const visibleFields = resolvedModelConfig.fields.filter((f) => !f.hiddenEdit);

    //console.log('🔍 Validating form for entity:', { entityType, resolvedEntityType, visibleFieldsCount: visibleFields.length });

    visibleFields.forEach((field) => {
      const value = editData[field.name];
      const error = FieldResolver.validateField(field, value, resolvedEntityType);

      if (error) {
        //console.log('❌ Validation error:', { field: field.name, value, error });
        newErrors[field.name] = error;
      }
    });

    const isValid = Object.keys(newErrors).length === 0;
    //console.log('🔍 Form validation result:', { isValid, errorCount: Object.keys(newErrors).length, errors: newErrors });

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Follow RowForm pattern but adapt for our API
      const isUpdate = entity && entity.id && !isNewEntity;

      // Filter editData to only include fields that should be sent to backend
      // Apply the same filtering logic used during initialization
      const filteredData = {};
      resolvedModelConfig.fields.forEach((field) => {
        // Exclude fields that shouldn't be sent to backend:
        // - Hidden fields (hiddenEdit, hiddenCreate)
        // - Virtual/computed fields (snippet fields, etc.)
        // - Some relationship fields (files, favorittTiltak, children, parent) but NOT krav (which backend handles)
        // - System fields (id, timestamps, audit fields)
        const isHidden = isUpdate ? field.hiddenEdit : field.hiddenCreate;
        const isVirtual = field.name.includes("Snippet") || field.name.includes("Plain");
        const isExcludedRelationship = ["files", "favorittTiltak", "favorittAvBrukere", "children", "parent"].includes(field.name);
        const isSystemField = ["id", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(field.name);

        if (!isHidden && !isVirtual && !isExcludedRelationship && !isSystemField && editData.hasOwnProperty(field.name)) {
          filteredData[field.name] = editData[field.name];
        }
      });

      let updatedData;

      // For combined views, use the correct model config's update function directly
      if (entity?.entityType && entity.entityType !== entityType && resolvedModelConfig.updateFn) {
        // Use the resolved model config's update function for combined entities
        if (isUpdate) {
          const saveData = { ...filteredData, id: entity.id };
          updatedData = await resolvedModelConfig.updateFn(entity.id, saveData);

          // Handle propagation and cache updates for combined view updates
          const actualEntityType = entity.entityType; // "tiltak", "krav", "prosjekttiltak", "prosjektkrav"

          // Import and apply enhanced optimistic updates
          try {
            const { handleEmnePropagationInvalidation } = await import("@/components/EntityWorkspace/utils/optimisticUpdates.js");

            // Apply propagation handling if this is a krav/prosjektKrav update with delay for backend completion
            setTimeout(() => {
              handleEmnePropagationInvalidation(queryClient, updatedData || saveData, entity, actualEntityType);
            }, 100);
          } catch (error) {
            console.warn("Could not apply propagation updates:", error);
          }

          // Manually invalidate caches for combined view updates since we bypass useEntityWorkspaceActions
          queryClient.invalidateQueries({
            queryKey: [actualEntityType, "workspace"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["combined", "workspace"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["combinedEntities", "workspace"],
            exact: false,
          });
          // Also invalidate the current workspace type cache
          queryClient.invalidateQueries({
            queryKey: [entityType, "workspace"],
            exact: false,
          });
        } else {
          updatedData = await resolvedModelConfig.createFn(filteredData);

          // Manually invalidate caches for combined view creates
          const actualEntityType = entity.entityType; // "tiltak", "krav", "prosjekttiltak", "prosjektkrav"

          // Ensure the created entity has the correct entityType for combined view display
          if (updatedData && actualEntityType) {
            const createdEntity = updatedData.data || updatedData;
            createdEntity.entityType = actualEntityType;

            // Set the isEntityJustCreated flag and update store for autoScroll
            useEntityWorkspaceStore.setState({
              selectedEntity: createdEntity,
              activeEntity: createdEntity,
              isEntityJustCreated: true,
            });
          }
          queryClient.invalidateQueries({
            queryKey: [actualEntityType, "workspace"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["combined", "workspace"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["combinedEntities", "workspace"],
            exact: false,
          });
          // Also invalidate the current workspace type cache
          queryClient.invalidateQueries({
            queryKey: [entityType, "workspace"],
            exact: false,
          });

          // Set the created entity as selected for auto-scroll (same as store does)
          if (updatedData) {
            const createdEntity = updatedData.data || updatedData;
            // Ensure the created entity has the correct entityType for combined view display
            createdEntity.entityType = actualEntityType;

            // Use the store's setSelectedEntity function with justCreated flag for auto-scroll
            const { setSelectedEntity, setActiveEntity } = useEntityWorkspaceStore.getState();
            setSelectedEntity(createdEntity, true); // Set justCreated=true for auto-scroll
            setActiveEntity(createdEntity);
          }
        }
      } else {
        // Use the standard onSave handler for regular views
        if (isUpdate) {
          // For updates: API needs id for URL path, so include it
          // But the backend validates only the body, so we pass the id separately
          const saveData = { ...filteredData, id: entity.id };
          updatedData = await onSave(saveData, isUpdate);
        } else {
          // For creates: add the necessary fields for the store to detect it's a new entity
          const createData = {
            ...filteredData,
            id: "create-new", // Preserve the create-new identifier
            isNew: true, // Add explicit new flag
          };
          updatedData = await onSave(createData, isUpdate);

          // Also set the flag here as backup (though the store's handleSave should already do this)
          if (updatedData && (entityType === "krav" || entityType === "tiltak")) {
            const createdEntity = updatedData.data || updatedData;
            useEntityWorkspaceStore.setState({
              selectedEntity: createdEntity,
              activeEntity: createdEntity,
              isEntityJustCreated: true,
            });
          }
        }

        // Handle emne propagation for krav/prosjektKrav updates in regular EntityWorkspace
        const camelCaseEntityType = entityType.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        console.log(
          `🔍 EntityDetailPane: Checking emne propagation for entityType: ${entityType} (${camelCaseEntityType}), emneId changed:`,
          (updatedData || { ...filteredData, id: entity.id }).emneId !== entity.emneId
        );

        if (camelCaseEntityType === "krav" || camelCaseEntityType === "prosjektKrav") {
          try {
            const { handleEmnePropagationInvalidation } = await import("@/components/EntityWorkspace/utils/optimisticUpdates.js");

            // Add a small delay to ensure backend propagation completes before cache invalidation
            setTimeout(() => {
              handleEmnePropagationInvalidation(queryClient, updatedData || { ...filteredData, id: entity.id }, entity, entityType);
            }, 100);
          } catch (error) {
            console.warn("Could not apply propagation updates:", error);
          }
        }

        // Handle cache invalidation for emne entity updates
        if (camelCaseEntityType === "emne" || entityType === "emne") {
          // For emne updates, invalidate the individual emne cache so edit forms get fresh data
          queryClient.invalidateQueries({
            queryKey: ["emne"],
            exact: false,
          });

          // Also invalidate related queries that might use emne data
          queryClient.invalidateQueries({
            queryKey: ["emner"],
            exact: false,
          });
        }
      }

      // Update local entity data with the saved changes for immediate display
      // Use the API response data if available (should include populated relationships)
      // Otherwise fall back to form data
      if (updatedData) {
        // Extract the actual entity data from the API response
        const responseData = updatedData.data || updatedData;

        // Filter out undefined values to prevent controlled/uncontrolled input warnings
        const filteredUpdatedData = {};
        Object.entries(responseData).forEach(([key, value]) => {
          if (value !== undefined) {
            filteredUpdatedData[key] = value;
          }
        });

        // Update the entity object with fresh data from the API
        Object.assign(entity, filteredUpdatedData);

        // Force a re-render by updating editData to reflect the saved state
        setEditData({ ...filteredUpdatedData });
      } else {
        // Fallback: just update with form data (should rarely happen)
        Object.assign(entity, editData);
      }

      setIsEditing(false);
      setEntityEditing(entity.id, false);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving entity:", error);
      // Error handling would show a toast or similar
    }
  };
  const handleCancel = () => {
    // Reset to original entity values
    const resetData = {};
    resolvedModelConfig.fields.forEach((field) => {
      resetData[field.name] = entity[field.name] || "";
    });
    setEditData(resetData);
    setIsEditing(false);
    setEntityEditing(entity.id, false);
    setHasChanges(false);
    setErrors({});
  };

  const handleDelete = () => {
    if (!entity.id || entity.id === "create-new") {
      console.error("Cannot delete entity without valid ID:", entity.id);
      return;
    }
    if (window.confirm(actionPermissions.deleteConfirmText)) {
      onDelete(entity);
      onClose(); // Close detail pane after delete
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Handle Enter key for saving in edit mode
      if (e.key === "Enter" && isEditing && !e.shiftKey) {
        // Special handling for different input types
        if (e.target.tagName === "TEXTAREA") {
          // Allow normal Enter in textareas (for line breaks)
          return;
        }

        if (e.target.contentEditable === "true") {
          // For TipTap editors, don't trigger save on Enter
          return;
        }

        // For all other cases (INPUT fields, or general form), save the form
        e.preventDefault();
        handleSave();
        return;
      }

      // Handle Escape for canceling edit mode
      if (e.key === "Escape" && isEditing) {
        e.preventDefault();
        handleCancel();
        return;
      }

      // Don't trigger other shortcuts if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.contentEditable === "true") {
        return;
      }

      // General shortcuts (when not in input fields)
      switch (e.key) {
        case "e":
        case "E":
          setIsEditing(true);
          setEntityEditing(entity.id, true);
          scrollToTop(); // Scroll to top when entering edit mode
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, handleCancel, handleSave, actionPermissions.canEdit]);

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto">
      {/* Sticky Header */}
      <div className={`flex-shrink-0 px-6 py-4 border-b border-gray-200 transition-colors ${isEditing ? "bg-blue-50" : "bg-white"}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              {/*<span className="text-xs text-gray-500">{entity.emne?.tittel || entity.kategori?.navn}</span>*/}
              {/*entity.obligatorisk ? (
                <span className="px-2 py-1 text-xs bg-red-50 text-red-700 rounded-full">Obligatorisk</span>
              ) : (
                <span className="px-2 py-1 text-xs bg-gray-50 text-gray-600 rounded-full">Valgfri</span>
              )*/}
            </div>
            {/* Title - editable in edit mode */}
            <div className="flex items-center gap-3">
              {uidField && <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{uid}</span>}
              {isEditing ? (
                <input
                  type="text"
                  value={editData.tittel || ""}
                  onChange={(e) => handleFieldChange("tittel", e.target.value)}
                  className="text-xl font-semibold text-gray-900 leading-tight flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tittel..."
                />
              ) : (
                <h1 className="text-xl font-semibold text-gray-900 leading-tight">{title}</h1>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={!isNewEntity && !hasChanges}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Lagre (trykk Enter)"
                >
                  <Save className="w-4 h-4 mr-1.5 inline" />
                  {isNewEntity ? "Lagre" : "Oppdater"}
                </button>
                <button
                  onClick={handleCancel}
                  tabIndex={-1}
                  className="px-3 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  title="Avbryt (trykk Esc)"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5 inline" />
                  Avbryt
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEntityEditing(entity.id, true);
                    scrollToTop(); // Scroll to top when entering edit mode
                  }}
                  tabIndex={-1}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Rediger (trykk E)"
                >
                  <Edit className="w-4 h-4 mr-1.5 inline" />
                  Rediger
                </button>
                {actionPermissions.canDelete && entity.id && !isNewEntity && (
                  <button
                    onClick={handleDelete}
                    tabIndex={-1}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Slett"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
            <button onClick={onClose} tabIndex={-1} className="p-2 text-gray-400 hover:text-gray-600 transition-colors" title="Lukk">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit mode indicator */}
        {isEditing && <div className="mt-3 text-xs text-blue-700">Redigeringsmodus - trykk Enter for å lagre eller Esc for å avbryte</div>}

        {/* Subtle keyboard hint when not editing */}
        {!isEditing && <div className="mt-3 text-xs text-gray-500">Trykk E for å redigere</div>}
      </div>

      {/* Content Area */}
      <div ref={detailViewRef} className="flex-1 overflow-y-auto">
        <div className="px-6 py-6">
          <EntityDetailForm
            entity={entity}
            modelConfig={resolvedModelConfig}
            modelName={resolvedEntityType}
            isEditing={isEditing}
            onFieldChange={handleFieldChange}
            formData={editData}
            errors={errors}
            detailConfig={resolvedConfig.detailForm || {}}
            excludeFields={[titleField]} // Hide title field since it's in the header
          />
        </div>
      </div>
    </div>
  );
};

export default EntityDetailPane;
