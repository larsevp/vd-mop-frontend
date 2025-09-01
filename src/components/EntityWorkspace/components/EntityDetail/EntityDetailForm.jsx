import React, { useState, useEffect } from "react";
import { FieldResolver } from "@/components/tableComponents/fieldTypes/fieldResolver.jsx";
import { DisplayValueResolver } from "@/components/tableComponents/displayValues/DisplayValueResolver.jsx";
import { InfoIcon } from "@/components/ui/InfoIcon.jsx";

/**
 * EntityDetailForm - Reuses RowForm logic for EntityDetailPane
 *
 * Features:
 * - Uses same field configuration as RowForm (hiddenEdit, hiddenCreate, etc.)
 * - Allows EntityDetailPane-specific overrides
 * - Supports view/edit modes with progressive disclosure
 * - Uses FieldResolver for consistent field rendering
 */

// Validation error summary component
const ValidationErrorSummary = ({ errors }) => {
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
      <p className="text-red-700 text-sm mb-3">
        Følgende felt må fylles ut før du kan lagre:
      </p>
      <ul className="text-red-700 text-sm space-y-1">
        {errorEntries.map(([fieldName, error]) => (
          <li key={fieldName} className="flex items-start">
            <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
            <span>{error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Error display component
const ErrorDisplay = ({ error }) => {
  if (!error) return null;

  return (
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
  );
};

// Field renderer using FieldResolver (same as RowForm)
const FieldRenderer = ({ field, value, onChange, error, form, entity, modelName, isEditing }) => {
  const Component = FieldResolver.getFieldComponent(field, modelName);

  // Derive entityType from modelName for inheritance context
  const entityType = modelName === 'prosjektTiltak' ? 'prosjektTiltak' : 
                     modelName === 'tiltak' ? 'tiltak' : 
                     modelName;

  // Check if the component handles its own label
  const componentHandlesOwnLabel = modelName && FieldResolver.getModelSpecificFields(modelName).fieldNames?.[field.name];

  if (componentHandlesOwnLabel) {
    // Component handles its own label
    return <Component field={field} value={value} onChange={onChange} error={error} form={form} row={entity} modelName={modelName} entityType={entityType} />;
  }

  // For view mode, render value differently
  if (!isEditing) {
    // Use DisplayValueResolver for consistent display logic
    const displayValue = DisplayValueResolver.getDisplayComponent(
      entity,
      field,
      "DETAIL", // source context
      modelName
    );

    return (
      <div className="mb-6" key={`${entity?.id}-${field.name}`}>
        <div className="flex items-center gap-1 mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <InfoIcon info={field.field_info} />
        </div>
        <div className="text-gray-900" key={`${entity?.id}-${field.name}-value`}>{displayValue}</div>
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
      {/* Add error boundary for Component rendering */}
      {(() => {
        try {
          return <Component field={field} value={value} onChange={onChange} error={error} form={form} row={entity} modelName={modelName} entityType={entityType} />;
        } catch (renderError) {
          if (field.name === 'kravreferansetypeId') {
            console.error('🔍 kravreferansetypeId Component render error:', renderError);
          }
          return <div className="text-red-600 text-sm">Error rendering field: {renderError.message}</div>;
        }
      })()}
    </div>
  );
};

// Section component for organizing fields - clean design with box-like hover
const FieldSection = ({ title, isExpanded, onToggle, children, noTitle = false }) => {
  // If noTitle is true, render children directly without collapsible structure
  if (noTitle) {
    return <div className="space-y-4">{children}</div>;
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center text-left hover:bg-gray-50 transition-colors duration-200 py-3 px-2 -mx-2 rounded-md gap-3"
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

const EntityDetailForm = ({
  entity,
  modelConfig,
  modelName,
  isEditing,
  onFieldChange,
  formData,
  errors = {},
  detailConfig = {},
  excludeFields = [],
}) => {
  const sectionConfig = detailConfig.sections || {
    main: { title: "Informasjon", defaultExpanded: true },
  };

  // Merge model config with detail-specific overrides
  const getEffectiveFieldConfig = (field) => {
    const detailOverrides = detailConfig.fieldOverrides?.[field.name] || {};

    return {
      ...field,
      detailSection: detailOverrides.section || "main",
      detailOrder: detailOverrides.order || 0,
      detailRow: detailOverrides.row || null,
    };
  };

  // Get visible fields for the detail view
  const getVisibleFields = () => {
    const processedFields = modelConfig.fields
      .map(getEffectiveFieldConfig)
      .filter((field) => {
        // Apply standard RowForm logic
        const standardHidden = isEditing ? field.hiddenEdit : false; // Always show in view mode

        // Apply EntityDetailPane-specific hiding
        const detailHidden = field.hiddenDetail;

        // Apply workspace-level hiding (from detailConfig)
        const workspaceHiddenInEdit = isEditing && detailConfig.workspaceHiddenEdit?.includes(field.name);
        const workspaceHiddenInCreate = isEditing && entity?.id === "create-new" && detailConfig.workspaceHiddenCreate?.includes(field.name);
        const workspaceHiddenInIndex = !isEditing && detailConfig.workspaceHiddenIndex?.includes(field.name);
        const workspaceHidden = workspaceHiddenInEdit || workspaceHiddenInCreate || workspaceHiddenInIndex;

        // Exclude fields that are shown elsewhere (e.g., title in header)
        const isExcluded = excludeFields.includes(field.name);


        return !standardHidden && !detailHidden && !workspaceHidden && !isExcluded;
      })
      .sort((a, b) => (a.detailOrder || 0) - (b.detailOrder || 0));

    return processedFields;
  };

  // Initialize expanded sections based on defaultExpanded config
  const getInitialExpandedSections = () => {
    const expanded = new Set();
    Object.entries(sectionConfig).forEach(([sectionName, config]) => {
      if (config.defaultExpanded) {
        expanded.add(sectionName);
      }
    });
    return expanded;
  };

  const [expandedSections, setExpandedSections] = useState(getInitialExpandedSections);

  // Auto-expand sections with validation errors
  useEffect(() => {
    if (!errors || Object.keys(errors).length === 0) return;

    const sectionsWithErrors = new Set();
    const fields = getVisibleFields();

    // Check which sections have fields with errors
    fields.forEach((field) => {
      if (errors[field.name]) {
        const sectionName = field.detailSection || "main";
        sectionsWithErrors.add(sectionName);
      }
    });

    // Expand sections that have errors
    if (sectionsWithErrors.size > 0) {
      setExpandedSections((prev) => new Set([...prev, ...sectionsWithErrors]));
    }
  }, [errors]); // eslint-disable-line react-hooks/exhaustive-deps

  // Group fields by section
  const getFieldsBySection = () => {
    const fields = getVisibleFields();
    const sections = {};

    fields.forEach((field) => {
      const sectionName = field.detailSection || "main";
      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }
      sections[sectionName].push(field);
      
    });


    return sections;
  };

  // Get ordered sections based on config
  const getOrderedSections = () => {
    const sections = getFieldsBySection();
    const sectionOrder = Object.keys(sectionConfig);

    // Create ordered sections object
    const orderedSections = {};

    // First add sections in config order
    sectionOrder.forEach((sectionName) => {
      if (sections[sectionName]) {
        orderedSections[sectionName] = sections[sectionName];
      }
    });

    // Then add any remaining sections
    Object.entries(sections).forEach(([sectionName, fields]) => {
      if (!orderedSections[sectionName]) {
        orderedSections[sectionName] = fields;
      }
    });

    return orderedSections;
  };

  const orderedSections = getOrderedSections();

  // Group fields by row within each section
  const groupFieldsByRow = (fields) => {
    const rows = {};
    const standaloneFields = [];

    fields.forEach((field) => {
      if (field.detailRow) {
        if (!rows[field.detailRow]) {
          rows[field.detailRow] = [];
        }
        rows[field.detailRow].push(field);
      } else {
        standaloneFields.push(field);
      }
    });

    return { rows, standaloneFields };
  };

  // Toggle section expansion
  const toggleSection = (sectionName) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // Handle field changes - supports both event objects and (fieldName, value) calls
  const handleChange = (fieldNameOrEvent, value) => {
    let fieldName, fieldValue;
    
    if (typeof fieldNameOrEvent === 'string') {
      // Called as handleChange(fieldName, value)
      fieldName = fieldNameOrEvent;
      fieldValue = value;
    } else if (fieldNameOrEvent?.target) {
      // Called as handleChange(event)
      fieldName = fieldNameOrEvent.target.name;
      fieldValue = fieldNameOrEvent.target.value;
    } else {
      console.warn('Invalid onChange call in EntityDetailForm:', fieldNameOrEvent);
      return;
    }
    
    if (onFieldChange) {
      onFieldChange(fieldName, fieldValue);
    }
  };

  return (
    <div className="space-y-6">
      <ValidationErrorSummary errors={errors} />
      {Object.entries(orderedSections).map(([sectionName, fields]) => {
        const sectionInfo = sectionConfig[sectionName] || { title: sectionName };
        const isExpanded = expandedSections.has(sectionName);
        const { rows, standaloneFields } = groupFieldsByRow(fields);

        // Check if this is the main info section and should not be collapsible
        const isMainInfoSection = sectionName === "info" || sectionName === "main";
        const shouldBeCollapsible = !isMainInfoSection;

        // Render field content (same for both collapsible and non-collapsible)
        const fieldContent = (
          <>
            {/* Render standalone fields */}
            {standaloneFields.map((field) => {
              const fieldError = errors[field.name];

              return (
                <div key={field.name}>
                  <FieldRenderer
                    field={field}
                    value={formData[field.name] ?? ""}
                    onChange={handleChange}
                    error={fieldError}
                    form={formData}
                    entity={entity}
                    modelName={modelName}
                    isEditing={isEditing}
                  />
                  {fieldError && <ErrorDisplay error={fieldError} />}
                </div>
              );
            })}

            {/* Render row-grouped fields */}
            {Object.entries(rows).map(([rowName, rowFields]) => (
              <div
                key={rowName}
                className="grid gap-4"
                style={{
                  gridTemplateColumns: rowFields
                    .map((field) => {
                      // Dynamic column sizing based on field type
                      if (field.type === "checkbox" || field.type === "boolean") {
                        return "1fr";
                      } else if (field.type === "select" || field.type === "number") {
                        return "1fr";
                      } else if (field.type === "text" && field.name.includes("referanse")) {
                        return "1fr";
                      } else {
                        return "2fr";
                      }
                    })
                    .join(" "),
                }}
              >
                {rowFields.map((field) => {
                  const fieldError = errors[field.name];
                  return (
                    <div key={field.name}>
                      <FieldRenderer
                        field={field}
                        value={formData[field.name] ?? ""}
                        onChange={handleChange}
                        error={fieldError}
                        form={formData}
                        entity={entity}
                        modelName={modelName}
                        isEditing={isEditing}
                      />
                      {fieldError && <ErrorDisplay error={fieldError} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </>
        );

        return (
          <div key={sectionName}>
            {shouldBeCollapsible ? (
              <FieldSection 
                title={sectionInfo.title} 
                isExpanded={isExpanded} 
                onToggle={() => toggleSection(sectionName)}
                noTitle={sectionInfo.noTitle}
              >
                {fieldContent}
              </FieldSection>
            ) : (
              // Main info section without collapsible border/header
              <div className="space-y-6">
                {fieldContent}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EntityDetailForm;
