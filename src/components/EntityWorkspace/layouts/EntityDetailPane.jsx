import React, { useState, useEffect, useMemo } from "react";
import { Edit, X, ChevronDown, ChevronRight, Save, RotateCcw, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import EntityDetailForm from "../shared/EntityDetailForm";
import { FieldResolver } from "../../tableComponents/fieldTypes/fieldResolver.jsx";
import { modelConfigs } from "@/modelConfigs";

/**
 * Clean, minimal detail pane for selected entity
 * Features:
 * - Sticky header with title and actions
 * - Uses RowForm logic with EntityDetailPane-specific overrides
 * - Progressive disclosure with accordions
 * - Keyboard shortcuts: 'e' for edit, 'esc' for cancel
 */
const EntityDetailPane = ({ entity, modelConfig, entityType, config, onSave, onDelete, onClose, renderIcon, user }) => {
  // Check if this is a new entity being created
  const isNewEntity = entity?.id === "create-new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dynamically resolve the correct model config for combined entities
  const resolvedModelConfig = useMemo(() => {
    if (entity?.entityType && entity.entityType !== entityType) {
      // This is a combined entity with a different type - resolve the correct config
      const targetModelName = entity.entityType === "krav" ? "krav" : entity.entityType === "tiltak" ? "tiltak" : null;

      // EntityDetailPane - Resolving config for combined entity: entityType, originalEntityType, targetModelName, hasTargetConfig

      if (targetModelName && modelConfigs[targetModelName]) {
        return modelConfigs[targetModelName];
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
        const targetModelName = entity.entityType === "krav" ? "krav" : entity.entityType === "tiltak" ? "tiltak" : null;

        if (targetModelName && modelConfigs[targetModelName]) {
          const targetConfig = modelConfigs[targetModelName];
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

  // Initialize edit data when entity changes
  useEffect(() => {
    if (entity) {
      // For new entities, start in edit mode
      if (isNewEntity) {
        setIsEditing(true);
      }

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

        if (!isHidden && !isVirtual && !isRelationship && !isSystemField && field.name !== "id") {
          // Use FieldResolver to get proper initial values including defaults
          initialData[field.name] = FieldResolver.initializeFieldValue(field, entity, !isNewEntity, resolvedEntityType);
        }
      });
      setEditData(initialData);
      setHasChanges(false);
      setErrors({});
    }
  }, [entity, resolvedModelConfig, resolvedEntityType]);

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

    visibleFields.forEach((field) => {
      const value = editData[field.name];
      const error = FieldResolver.validateField(field, value, resolvedEntityType);

      if (error) {
        newErrors[field.name] = error;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

      // [DEBUG] Filtered data for update/create: filteredData

      // For combined views, use the correct model config's update function directly
      if (entity?.entityType && entity.entityType !== entityType && resolvedModelConfig.updateFn) {
        // Use the resolved model config's update function for combined entities
        if (isUpdate) {
          const saveData = { ...filteredData, id: entity.id };
          await resolvedModelConfig.updateFn(saveData);

          // Manually invalidate caches for combined view updates since we bypass useEntityWorkspaceActions
          const actualEntityType = entity.entityType; // "tiltak" or "krav"
          queryClient.invalidateQueries({
            queryKey: [actualEntityType, "workspace"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["combined", "workspace"],
            exact: false,
          });
        } else {
          await resolvedModelConfig.createFn(filteredData);

          // Manually invalidate caches for combined view creates
          const actualEntityType = entity.entityType; // "tiltak" or "krav"
          queryClient.invalidateQueries({
            queryKey: [actualEntityType, "workspace"],
            exact: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["combined", "workspace"],
            exact: false,
          });
        }
      } else {
        // Use the standard onSave handler for regular views
        if (isUpdate) {
          // For updates: API needs id for URL path, so include it
          // But the backend validates only the body, so we pass the id separately
          const saveData = { ...filteredData, id: entity.id };
          await onSave(saveData, isUpdate);
        } else {
          // For creates: just the form data
          await onSave(filteredData, isUpdate);
        }
      }

      // Update local entity data with the saved changes for immediate display
      Object.assign(entity, editData);

      setIsEditing(false);
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
    setHasChanges(false);
    setErrors({});
  };

  const handleDelete = () => {
    if (window.confirm(actionPermissions.deleteConfirmText)) {
      onDelete(entity);
      onClose(); // Close detail pane after delete
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.contentEditable === "true") {
        // Only handle Escape when in inputs during edit mode
        if (e.key === "Escape" && isEditing) {
          e.preventDefault();
          handleCancel();
        }
        return;
      }

      switch (e.key) {
        case "e":
        case "E":
          if (!isEditing && actionPermissions.canEdit) {
            e.preventDefault();
            setIsEditing(true);
          }
          break;
        case "Escape":
          if (isEditing) {
            e.preventDefault();
            handleCancel();
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, handleCancel, actionPermissions.canEdit]);

  return (
    <div className="flex flex-col h-full bg-white">
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
                  value={editData.tittel}
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
                >
                  <Save className="w-4 h-4 mr-1.5 inline" />
                  {isNewEntity ? "Lagre" : "Oppdater"}
                </button>
                <button
                  onClick={handleCancel}
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
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  title="Rediger (trykk E)"
                >
                  <Edit className="w-4 h-4 mr-1.5 inline" />
                  Rediger
                </button>
                <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Slett">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Edit mode indicator */}
        {isEditing && (
          <div className="mt-3 text-xs text-blue-700">Redigeringsmodus - gjør endringer og klikk "Lagre" eller "Avbryt" (Esc)</div>
        )}

        {/* Subtle keyboard hint when not editing */}
        {!isEditing && <div className="mt-3 text-xs text-gray-500">Trykk E for å redigere</div>}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
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
