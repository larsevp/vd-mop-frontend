import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Edit, X, Save, RotateCcw, Trash2, Plus } from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';
import { ValidationErrorSummary, FieldRenderer, FieldSection } from "./components";
import { getEntityTypeConfig } from "../../utils/entityTypeBadges";
import { TiptapDisplay } from "@/components/ui/editor/TiptapDisplay";
import {
  getVisibleFields,
  getFieldsBySection,
  getFieldRowsBySection,
  initializeFormData,
  validateForm,
  autoExpandErrorSections,
  handleSaveAction,
  handleDeleteAction,
  initializeExpandedSections,
  toggleSection,
  scrollToTop
} from "./helpers";

const EntityDetailPane = ({
  entity,
  modelConfig,
  onSave,
  onDelete,
  onClose,
  onCreateNew,
  entityType = "entity"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const detailViewRef = useRef(null);
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Configuration  
  const modelName = modelConfig?.modelPrintName || entityType;
  const detailFormConfig = useMemo(() => modelConfig?.workspace?.detailForm || {}, [modelConfig?.workspace?.detailForm]);
  const sections = useMemo(() => {
    return detailFormConfig.sections || { main: { title: "Informasjon", defaultExpanded: true } };
  }, [detailFormConfig.sections]);
  const fieldOverrides = useMemo(() => detailFormConfig.fieldOverrides || {}, [detailFormConfig.fieldOverrides]);
  const workspaceHiddenEdit = useMemo(() => detailFormConfig.workspaceHiddenEdit || [], [detailFormConfig.workspaceHiddenEdit]);
  const workspaceHiddenIndex = useMemo(() => detailFormConfig.workspaceHiddenIndex || [], [detailFormConfig.workspaceHiddenIndex]);
  const allFields = useMemo(() => modelConfig?.fields || [], [modelConfig?.fields]);

  // Get visible fields using helper
  const visibleFields = useMemo(() => 
    getVisibleFields(allFields, fieldOverrides, isEditing, workspaceHiddenEdit, workspaceHiddenIndex, sections),
    [allFields, fieldOverrides, isEditing, workspaceHiddenEdit, workspaceHiddenIndex, sections]
  );

  // Validation function using helper
  const validateFormData = useCallback(() => {
    const newErrors = validateForm(visibleFields, formData, modelName);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [visibleFields, formData, modelName]);

  // Handle new entity creation
  useEffect(() => {
    if (entity?.__isNew) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [entity?.__isNew]);

  // Initialize form data
  useEffect(() => {
    if (entity) {
      const initialForm = initializeFormData(allFields, entity, modelName);

      // For new entities, ensure relationship fields from initial data are included
      if (entity.__isNew) {
        // Include relationship fields that were passed in initial data
        ['krav', 'prosjektKrav'].forEach(relationField => {
          if (entity[relationField] !== undefined) {
            initialForm[relationField] = entity[relationField];
          }
        });
      }

      setFormData(initialForm);
    }
  }, [entity, modelName, allFields]);

  // Initialize expanded sections
  useEffect(() => {
    const initialExpanded = initializeExpandedSections(sections);
    setExpandedSections(initialExpanded);
  }, [sections]);

  // Auto-expand error sections
  useEffect(() => {
    autoExpandErrorSections(errors, visibleFields, setExpandedSections);
  }, [errors, visibleFields]);

  // Scroll to top when editing
  useEffect(() => {
    if (isEditing) {
      scrollToTop(detailViewRef);
    }
  }, [isEditing]);

  // Field change handler
  const handleFieldChange = useCallback((fieldNameOrEvent, value) => {
    let fieldName, fieldValue;

    if (typeof fieldNameOrEvent === "string") {
      fieldName = fieldNameOrEvent;
      fieldValue = value;
    } else if (fieldNameOrEvent?.target) {
      fieldName = fieldNameOrEvent.target.name;
      fieldValue = fieldNameOrEvent.target.value;
    } else {
      return;
    }

    setFormData(prev => ({ ...prev, [fieldName]: fieldValue }));
    
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
  }, [errors]);

  // Create save handler from modelConfig if onSave is not provided or is null
  const createSaveHandler = useCallback(async (saveData, isUpdate) => {
    let result;
    
    if (onSave && typeof onSave === 'function') {
      // Use provided onSave if available
      result = await onSave(saveData, isUpdate);
    } else if (modelConfig) {
      // Create save handler from modelConfig
      if (isUpdate && modelConfig.updateFn) {
        result = await modelConfig.updateFn(saveData.id, saveData);
      } else if (!isUpdate && modelConfig.createFn) {
        result = await modelConfig.createFn(saveData);
      } else {
        throw new Error(`${isUpdate ? 'Update' : 'Create'} function not available in modelConfig`);
      }
      
      // Invalidate relevant query caches to refresh data
      await queryClient.invalidateQueries({ 
        queryKey: ['entities'] 
      });
    } else {
      throw new Error('No save handler available');
    }
    
    return result;
  }, [onSave, modelConfig, queryClient]);

  // Save handler using helper
  const handleSave = useCallback(async () => {
    const result = await handleSaveAction(validateFormData, formData, entity, createSaveHandler, setIsSubmitting, setIsEditing);
    if (!result.success && result.errors) {
      setErrors(result.errors);
    }
  }, [validateFormData, formData, entity, createSaveHandler]);

  // Create delete handler from modelConfig if onDelete is not provided or is null
  const createDeleteHandler = useCallback(async (entityToDelete) => {
    let result;
    
    if (onDelete && typeof onDelete === 'function') {
      // Use provided onDelete if available
      result = await onDelete(entityToDelete);
    } else if (modelConfig && modelConfig.deleteFn) {
      // Create delete handler from modelConfig
      result = await modelConfig.deleteFn(entityToDelete.id, entityToDelete);
      
      // Invalidate relevant query caches to refresh data
      await queryClient.invalidateQueries({ 
        queryKey: ['entities'] 
      });
    } else {
      throw new Error('Delete function not available');
    }
    
    return result;
  }, [onDelete, modelConfig, queryClient]);

  // Delete handler using helper
  const handleDelete = useCallback(async () => {
    await handleDeleteAction(entity, createDeleteHandler);
  }, [entity, createDeleteHandler]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    const isNewEntity = entity?.__isNew;
    
    if (isNewEntity && onClose) {
      // For new entities, close the detail pane
      onClose();
    } else {
      // For existing entities, just exit edit mode and reset form
      setIsEditing(false);
      setErrors({});
      if (entity) {
        const resetForm = initializeFormData(allFields, entity, modelName);
        setFormData(resetForm);
      }
    }
  }, [entity, allFields, modelName, onClose]);

  // Toggle section using helper
  const handleToggleSection = useCallback((sectionName) => {
    toggleSection(sectionName, setExpandedSections);
  }, []);

  // Keyboard shortcuts - create stable refs for handlers
  const handleCancelRef = useRef();
  const handleSaveRef = useRef();

  // Update refs when functions change
  useEffect(() => {
    handleCancelRef.current = handleCancel;
    handleSaveRef.current = handleSave;
  });

  // Keyboard shortcuts with stable listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' && !isEditing && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === 'Escape' && isEditing) {
        e.preventDefault();
        if (handleCancelRef.current) {
          handleCancelRef.current();
        }
      } else if (e.key === 'Enter' && e.ctrlKey && isEditing) {
        e.preventDefault();
        if (handleSaveRef.current) {
          handleSaveRef.current();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing]); // Only depend on isEditing state

  // IMPORTANT: Early return AFTER all hooks to avoid hook consistency errors
  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Ingen element valgt</p>
      </div>
    );
  }

  // IMPORTANT: For consistent hook patterns, ensure modelConfig is always defined
  if (!modelConfig) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Laster...</p>
      </div>
    );
  }

  // Entity display info
  const isNewEntity = entity?.__isNew;
  const entityTitle = isNewEntity 
    ? `Ny ${modelName}` 
    : (entity.tittel || entity.navn || `${entityType} ${entity.id}`);
  const entityUID = isNewEntity ? null : (entity.kravUID || entity.tiltakUID || entity.uid);
  const emneTitle = isNewEntity ? null : (entity.emne?.navn || entity.emneTittel);
  
  // Get entity type for badge (from entity or fallback to entityType prop)
  const currentEntityType = entity?.entityType || entity?.__entityType || entityType;
  const entityConfig = getEntityTypeConfig(currentEntityType);

  // Handle creating connected tiltak from krav
  const handleCreateConnectedTiltak = useCallback(() => {
    if (!onCreateNew || !entity) {
      return;
    }

    // Support both krav -> tiltak and prosjektkrav -> prosjekttiltak
    let targetEntityType, relationshipField, relationshipValue;

    const entityTypeLower = currentEntityType.toLowerCase();

    if (entityTypeLower === 'krav') {
      targetEntityType = 'tiltak';
      relationshipField = 'krav';
      relationshipValue = { krav: [entity.id] };
    } else if (entityTypeLower === 'prosjektkrav') {
      targetEntityType = 'prosjekttiltak';
      relationshipField = 'prosjektKrav';
      relationshipValue = { prosjektKrav: [entity.id] };
    } else {
      return; // Not a supported entity type
    }

    const initialData = {
      tittel: `Tiltak ${entity.tittel}`, // Add "Tiltak " prefix to the copied krav title
      ...relationshipValue, // Set the connected relationship
      // Add source krav context for UI display
      __sourceKrav: {
        id: entity.id,
        tittel: entity.tittel,
        beskrivelse: entity.beskrivelse,
        beskrivelseSnippet: entity.beskrivelseSnippet,
        entityType: currentEntityType
      }
    };

    onCreateNew(targetEntityType, initialData);
  }, [onCreateNew, entity, currentEntityType]);


  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className={`sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-50 transition-colors ${isEditing ? "bg-blue-50" : "bg-white"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {entityUID && (
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${entityConfig.badgeColor}`}>
                {entityUID}
              </span>
            )}
            {!isNewEntity && (
              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${entityConfig.badgeColor}`}>
                {entityConfig.shortLabel}
              </span>
            )}
            {emneTitle && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                {emneTitle}
              </span>
            )}
            
            {isEditing ? (
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={formData.tittel || ""}
                  onChange={(e) => handleFieldChange("tittel", e.target.value)}
                  className={`text-xl font-semibold leading-tight w-full border rounded-lg px-3 py-2 focus:ring-2 focus:border-transparent ${
                    errors.tittel
                      ? 'border-red-300 text-red-900 focus:ring-red-500'
                      : 'text-gray-900 border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Tittel..."
                />
                {errors.tittel && (
                  <p className="mt-1 text-sm text-red-600">{errors.tittel}</p>
                )}
              </div>
            ) : (
              <h2 className="text-xl font-semibold text-gray-900 truncate flex-1 min-w-0">
                {entityTitle}
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  tabIndex={-1}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Lagrer...' : 'Lagre'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  tabIndex={-1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Avbryt
                </button>
              </>
            ) : (
              <>
                {/* Show "Lag tilknyttet tiltak" button for krav/prosjektkrav in combined workspace */}
                {onCreateNew && (currentEntityType.toLowerCase() === 'krav' || currentEntityType.toLowerCase() === 'prosjektkrav') && !isNewEntity && (
                  <button
                    onClick={handleCreateConnectedTiltak}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    {currentEntityType.toLowerCase() === 'krav' ? 'Lag tilknyttet tiltak' : 'Lag tilknyttet prosjekttiltak'}
                  </button>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Rediger
                </button>
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Slett
                  </button>
                )}
              </>
            )}

            {onClose && (
              <button
                onClick={onClose}
                tabIndex={-1}
                className="inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {isEditing && (
          <div className="mt-3 text-xs text-blue-700">Redigeringsmodus - trykk Enter for å lagre eller Esc for å avbryte</div>
        )}

        {!isEditing && (
          <div className="mt-3 text-xs text-gray-500">Trykk E for å redigere</div>
        )}
      </div>

      {/* Content */}
      <div ref={detailViewRef} className="flex-1 min-h-0 px-6 py-6">
        <ValidationErrorSummary errors={errors} fields={visibleFields} />

        {/* Source Krav Context Box - only shown when created via "Lag tilknyttet tiltak" */}
        {entity?.__sourceKrav && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-sm font-medium">
                    {entity.__sourceKrav.entityType === 'prosjektkrav' ? 'PK' : 'K'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Tilknyttet {entity.__sourceKrav.entityType === 'prosjektkrav' ? 'prosjektkrav' : 'krav'}: {entity.__sourceKrav.tittel}
                </div>
                {entity.__sourceKrav.beskrivelse && (
                  <div className="text-sm text-gray-600 mt-2">
                    <TiptapDisplay
                      content={entity.__sourceKrav.beskrivelse}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {Object.entries(sections).map(([sectionName, sectionInfo]) => {
            const sectionFields = getFieldsBySection(visibleFields)[sectionName] || [];
            if (sectionFields.length === 0) return null;

            const isExpanded = expandedSections.has(sectionName);
            const isMainInfoSection = sectionName === "info" || sectionName === "main";
            const { rowGroups, noRowFields } = getFieldRowsBySection(sectionFields);
            
            const fieldContent = (
              <div className="space-y-4">
                {noRowFields.map(field => (
                  <FieldRenderer
                    key={field.name}
                    field={field}
                    value={formData[field.name] ?? ""}
                    onChange={handleFieldChange}
                    error={errors[field.name]}
                    form={formData}
                    entity={entity}
                    modelName={modelName}
                    isEditing={isEditing}
                  />
                ))}
                
                {Object.entries(rowGroups)
                  .sort(([,fieldsA], [,fieldsB]) => {
                    const minOrderA = Math.min(...fieldsA.map(f => f.detailOrder || 0));
                    const minOrderB = Math.min(...fieldsB.map(f => f.detailOrder || 0));
                    return minOrderA - minOrderB;
                  })
                  .map(([rowName, rowFields]) => (
                    <div key={rowName} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rowFields
                        .sort((a, b) => (a.detailOrder || 0) - (b.detailOrder || 0))
                        .map(field => (
                          <div key={field.name}>
                            <FieldRenderer
                              field={field}
                              value={formData[field.name] ?? ""}
                              onChange={handleFieldChange}
                              error={errors[field.name]}
                              form={formData}
                              entity={entity}
                              modelName={modelName}
                              isEditing={isEditing}
                            />
                          </div>
                        ))
                      }
                    </div>
                  ))
                }
              </div>
            );

            if (isMainInfoSection) {
              return <div key={sectionName}>{fieldContent}</div>;
            }

            return (
              <FieldSection
                key={sectionName}
                title={sectionInfo.title}
                isExpanded={isExpanded}
                onToggle={() => handleToggleSection(sectionName)}
                noTitle={sectionInfo.noTitle}
              >
                {fieldContent}
              </FieldSection>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EntityDetailPane;