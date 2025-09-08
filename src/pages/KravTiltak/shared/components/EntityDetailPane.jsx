import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Edit, X, Save, RotateCcw, Trash2 } from "lucide-react";
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";
import { InfoIcon } from "@/components/ui/InfoIcon.jsx";
import Swal from "sweetalert2";

/**
 * EntityDetailPane - Detail view component following main branch patterns
 * 
 * Features:
 * - Sticky header with title and actions
 * - Uses EntityDetailForm for field rendering
 * - Progressive disclosure with accordions  
 * - Keyboard shortcuts: 'e' for edit, 'esc' for cancel
 * - ModelConfig-driven field organization
 */

// Validation error summary component
const ValidationErrorSummary = ({ errors, fields }) => {
  const errorEntries = Object.entries(errors || {}).filter(([_, error]) => error);

  if (errorEntries.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center mb-2">
        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <h3 className="text-red-800 font-medium">Validering feilet</h3>
      </div>
      <p className="text-red-700 text-sm mb-3">Følgende felt må fylles ut før du kan lagre:</p>
      <ul className="text-red-700 text-sm space-y-1">
        {errorEntries.map(([fieldName, error]) => {
          const field = fields.find(f => f.name === fieldName);
          const fieldLabel = field ? field.label : fieldName;
          return (
            <li key={fieldName} className="flex items-start">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>{fieldLabel}: {error}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// Field renderer using FieldResolver patterns
const FieldRenderer = ({ field, value, onChange, error, form, entity, modelName, isEditing }) => {
  const Component = FieldResolver.getFieldComponent(field, modelName);
  const componentHandlesOwnLabel = modelName && FieldResolver.getModelSpecificFields(modelName).fieldNames?.[field.name];

  if (componentHandlesOwnLabel) {
    return (
      <Component
        field={field}
        value={value}
        onChange={onChange}
        error={error}
        form={form}
        row={entity}
        modelName={modelName}
      />
    );
  }

  if (!isEditing) {
    // View mode: Use DisplayValueResolver
    const displayValue = DisplayValueResolver.getDisplayComponent(
      entity,
      field,
      "DETAIL",
      modelName
    );

    return (
      <div className="mb-6">
        <div className="flex items-center gap-1 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <InfoIcon info={field.field_info} />
        </div>
        <div className="text-gray-900">
          {displayValue}
        </div>
      </div>
    );
  }

  // Edit mode - same as RowForm
  return (
    <div className="mb-6">
      <div className="flex items-center gap-1 mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <InfoIcon info={field.field_info} />
      </div>
      <Component
        field={field}
        value={value}
        onChange={onChange}
        error={error}
        form={form}
        row={entity}
        modelName={modelName}
      />
      {error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Section component for organizing fields
const FieldSection = ({ title, isExpanded, onToggle, children, noTitle = false }) => {
  if (noTitle) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center text-left hover:bg-gray-50 transition-colors duration-200 py-3 px-2 -mx-2 rounded-md gap-3 border border-gray-200"
      >
        <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
          {isExpanded ? "−" : "+"}
        </div>
        <h3 className="text-sm font-medium text-gray-800">{title}</h3>
      </button>
      {isExpanded && <div className="space-y-4 pt-2 pl-2">{children}</div>}
    </div>
  );
};

const EntityDetailPane = ({
  entity,
  modelConfig,
  onSave,
  onDelete,
  onClose,
  entityType = "entity"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Ref for the detail view container to enable scrolling
  const detailViewRef = useRef(null);

  // Get modelName and configuration
  const modelName = modelConfig?.modelPrintName || entityType;
  const detailFormConfig = modelConfig?.workspace?.detailForm || {};
  const sections = detailFormConfig.sections || { main: { title: "Informasjon", defaultExpanded: true } };
  const fieldOverrides = detailFormConfig.fieldOverrides || {};
  const workspaceHiddenEdit = detailFormConfig.workspaceHiddenEdit || [];
  const workspaceHiddenIndex = detailFormConfig.workspaceHiddenIndex || [];
  const allFields = modelConfig?.fields || [];

  // Handle new entity creation mode
  useEffect(() => {
    if (entity?.__isNew) {
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [entity?.__isNew]);

  // Initialize form data using FieldResolver
  useEffect(() => {
    if (entity) {
      const initialForm = {};
      allFields.forEach((field) => {
        const isHidden = field.hiddenEdit || field.hiddenCreate;
        const isVirtual = field.name.includes("Snippet") || field.name.includes("Plain");
        const isRelationship = ["krav", "files", "favorittTiltak", "favorittAvBrukere", "children", "parent"].includes(field.name);
        const isSystemField = ["id", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(field.name);

        if (!isHidden && !isVirtual && !isRelationship && !isSystemField) {
          // For critical fields like tittel, beskrivelse, use entity value directly as fallback
          const fieldValue = FieldResolver.initializeFieldValue(field, entity, true, modelName);
          initialForm[field.name] = fieldValue !== undefined ? fieldValue : entity[field.name] || "";
        }
      });
      setFormData(initialForm);
    }
  }, [entity, modelName, allFields]);

  // Initialize expanded sections
  useEffect(() => {
    const initialExpanded = new Set();
    Object.entries(sections).forEach(([sectionName, config]) => {
      if (config.defaultExpanded) {
        initialExpanded.add(sectionName);
      }
    });
    setExpandedSections(initialExpanded);
  }, [sections]);

  // Auto-expand sections with validation errors
  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;

    const sectionsWithErrors = new Set();
    const visibleFields = getVisibleFields();

    visibleFields.forEach((field) => {
      if (errors[field.name]) {
        const sectionName = field.detailSection || "main";
        sectionsWithErrors.add(sectionName);
      }
    });

    if (sectionsWithErrors.size > 0) {
      setExpandedSections(prev => new Set([...prev, ...sectionsWithErrors]));
    }
  }, [errors]);

  // Scroll to top when entering edit mode
  useEffect(() => {
    if (isEditing && detailViewRef.current) {
      setTimeout(() => {
        detailViewRef.current.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [isEditing]);

  // Get visible fields based on configuration
  const getVisibleFields = useCallback(() => {
    return allFields
      .map(field => {
        const detailOverrides = fieldOverrides[field.name] || {};
        return {
          ...field,
          detailSection: detailOverrides.section || "main",
          detailOrder: detailOverrides.order || 0,
          detailRow: detailOverrides.row || null,
        };
      })
      .filter((field) => {
        const standardHidden = isEditing ? field.hiddenEdit : false;
        const workspaceHiddenInEdit = isEditing && workspaceHiddenEdit.includes(field.name);
        const workspaceHiddenInIndex = !isEditing && workspaceHiddenIndex.includes(field.name);
        const workspaceHidden = workspaceHiddenInEdit || workspaceHiddenInIndex;
        const isExcluded = field.name === "tittel"; // Title is handled in header

        return !standardHidden && !workspaceHidden && !isExcluded;
      })
      .sort((a, b) => {
        if (a.detailOrder !== b.detailOrder) {
          return a.detailOrder - b.detailOrder;
        }
        return a.name.localeCompare(b.name);
      });
  }, [allFields, fieldOverrides, isEditing, workspaceHiddenEdit, workspaceHiddenIndex]);

  // Group fields by section and then by rows
  const getFieldsBySection = useCallback(() => {
    const fields = getVisibleFields();
    const fieldSections = {};

    fields.forEach((field) => {
      const sectionName = field.detailSection || "main";
      if (!fieldSections[sectionName]) {
        fieldSections[sectionName] = [];
      }
      fieldSections[sectionName].push(field);
    });

    return fieldSections;
  }, [getVisibleFields]);

  // Group fields within a section by rows
  const getFieldRowsBySection = useCallback((sectionFields) => {
    const rowGroups = {};
    const noRowFields = [];

    sectionFields.forEach((field) => {
      if (field.detailRow) {
        if (!rowGroups[field.detailRow]) {
          rowGroups[field.detailRow] = [];
        }
        rowGroups[field.detailRow].push(field);
      } else {
        noRowFields.push(field);
      }
    });

    return { rowGroups, noRowFields };
  }, []);

  // Handle field changes
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
    
    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: "" }));
    }
  }, [errors]);

  // Validate form using FieldResolver
  const validateForm = useCallback(() => {
    const newErrors = {};
    const visibleFields = getVisibleFields();
    
    visibleFields.forEach((field) => {
      const value = formData[field.name];
      const error = FieldResolver.validateField(field, value, modelName);
      
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [getVisibleFields, formData, modelName]);

  // Handle save with validation
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const isNewEntity = entity?.__isNew;
      let saveData;
      
      if (isNewEntity) {
        // For new entities, don't include id
        saveData = { ...formData };
        delete saveData.id;
      } else {
        // For existing entities, include id
        saveData = { ...formData, id: entity.id };
      }
      
      if (onSave) {
        const result = await onSave(saveData, !isNewEntity); // Pass false for create, true for update
        setIsEditing(false);
        // The EntityWorkspace will handle selecting the newly created entity
      } else {
        console.error('No onSave handler provided');
        Swal.fire({
          icon: "error",
          title: "Konfigureringsfeil",
          text: "Ingen lagringsfunksjon tilgjengelig",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      Swal.fire({
        icon: "error",
        title: "Lagringsfeil",
        text: error?.message || "Kunne ikke lagre endringer",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, entity, onSave]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    const result = await Swal.fire({
      title: 'Slett element?',
      text: "Denne handlingen kan ikke angres.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Slett',
      cancelButtonText: 'Avbryt'
    });

    if (result.isConfirmed) {
      try {
        await onDelete(entity);
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire({
          icon: "error",
          title: "Slettingsfeil",
          text: error?.message || "Kunne ikke slette element",
          confirmButtonText: "OK",
        });
      }
    }
  }, [entity, onDelete]);

  // Cancel editing
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setErrors({});
    if (entity) {
      const resetForm = {};
      allFields.forEach((field) => {
        const isHidden = field.hiddenEdit || field.hiddenCreate;
        const isVirtual = field.name.includes("Snippet") || field.name.includes("Plain");
        const isRelationship = ["krav", "files", "favorittTiltak", "favorittAvBrukere", "children", "parent"].includes(field.name);
        const isSystemField = ["id", "createdAt", "updatedAt", "createdBy", "updatedBy"].includes(field.name);

        if (!isHidden && !isVirtual && !isRelationship && !isSystemField) {
          // Use the same logic as initial form setup
          const fieldValue = FieldResolver.initializeFieldValue(field, entity, true, modelName);
          resetForm[field.name] = fieldValue !== undefined ? fieldValue : entity[field.name] || "";
        }
      });
      setFormData(resetForm);
    }
  }, [entity, allFields, modelName]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionName) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'e' && !isEditing && !e.ctrlKey && !e.metaKey && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsEditing(true);
      } else if (e.key === 'Escape' && isEditing) {
        e.preventDefault();
        handleCancel();
      } else if (e.key === 'Enter' && e.ctrlKey && isEditing) {
        e.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleCancel, handleSave]);

  if (!entity) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Ingen element valgt</p>
      </div>
    );
  }

  // Extract entity display info
  const isNewEntity = entity?.__isNew;
  const entityTitle = isNewEntity 
    ? `Ny ${modelName}` 
    : (entity.tittel || entity.navn || `${entityType} ${entity.id}`);
  const entityUID = isNewEntity ? null : (entity.kravUID || entity.tiltakUID || entity.uid);
  const emneTitle = isNewEntity ? null : (entity.emne?.navn || entity.emneTittel);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Sticky Header */}
      <div className={`sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 transition-colors ${isEditing ? "bg-blue-50" : "bg-white"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            {/* Badges */}
            {entityUID && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 flex-shrink-0">
                {entityUID}
              </span>
            )}
            {emneTitle && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 flex-shrink-0">
                {emneTitle}
              </span>
            )}
            
            {/* Title/Input */}
            {isEditing ? (
              <input
                type="text"
                value={formData.tittel || ""}
                onChange={(e) => handleFieldChange("tittel", e.target.value)}
                className="text-xl font-semibold text-gray-900 leading-tight flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tittel..."
              />
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
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-1" />
                  {isSubmitting ? 'Lagrer...' : 'Lagre'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Avbryt
                </button>
              </>
            ) : (
              <>
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
                className="inline-flex items-center px-2 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Edit mode indicator */}
        {isEditing && (
          <div className="mt-3 text-xs text-blue-700">Redigeringsmodus - trykk Enter for å lagre eller Esc for å avbryte</div>
        )}

        {/* Keyboard shortcuts */}
        {!isEditing && (
          <div className="mt-3 text-xs text-gray-500">Trykk E for å redigere</div>
        )}
      </div>

      {/* Content Area */}
      <div ref={detailViewRef} className="flex-1 overflow-y-auto px-6 py-6">
        {/* Validation errors */}
        <ValidationErrorSummary errors={errors} fields={getVisibleFields()} />
        
        {/* Form sections */}
        <div className="space-y-6">
          {Object.entries(sections).map(([sectionName, sectionInfo]) => {
            const sectionFields = getFieldsBySection()[sectionName] || [];
            if (sectionFields.length === 0) return null;

            const isExpanded = expandedSections.has(sectionName);
            const isMainInfoSection = sectionName === "info" || sectionName === "main";
            
            const { rowGroups, noRowFields } = getFieldRowsBySection(sectionFields);
            
            const fieldContent = (
              <div className="space-y-4">
                {/* Render fields without row grouping first */}
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
                
                {/* Render grouped rows */}
                {Object.entries(rowGroups)
                  .sort(([,fieldsA], [,fieldsB]) => {
                    // Sort rows by the minimum order of their fields
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
              // Main info section without collapsible border/header
              return (
                <div key={sectionName}>
                  {fieldContent}
                </div>
              );
            }

            return (
              <FieldSection
                key={sectionName}
                title={sectionInfo.title}
                isExpanded={isExpanded}
                onToggle={() => toggleSection(sectionName)}
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