import React from "react";
import GenericMultiSelect from "../../../ui/form/GenericMultiSelect";
import { LovCheckboxGroup } from "../../../ui/form/LovSelect";
import { KravpakkerCheckboxGroup } from "../../../ui/form/KravpakkerSelect";
import { MULTISELECT_ENTITY_CONFIG } from "./config";
import { useProjectStore } from "../../../../stores/userStore";

// Generic multiselect for entity relationships
export const multiselectType = {
  multiselect: ({ field, value, onChange, error, entityType, formData, form, row, data, setFormData, disabled: propDisabled }) => {
    // Get configuration for this multiselect type (check both multiselectType and entityType)
    const configKey = field.multiselectType || field.entityType;
    const config = MULTISELECT_ENTITY_CONFIG[configKey];
    if (!config) {
      console.error(`No configuration found for multiselect type: ${configKey}`);
      return null;
    }

    // Get project context for project-scoped entities
    const { currentProject } = useProjectStore();
    const projectId = currentProject?.id;

    // Disabled state from parent or field config
    // For EntityWorkspace: propDisabled comes from FieldRenderer (inheritance logic)
    // For TableComponents: No complex inheritance needed
    const disabled = propDisabled !== undefined ? propDisabled : (field.disabled || false);
    const placeholder = field.placeholder || config.placeholder;

    // Handle value normalization for multiselect
    let selectedValues = [];
    let actualValue = value;

    // If value is undefined/null but we have row data, try to get the relationship data from row
    if (!actualValue && row && config.relationshipField) {
      // Try to find relationship data using the configured relationship field name
      const relationshipData = row[config.relationshipField];
      if (relationshipData && Array.isArray(relationshipData)) {
        actualValue = relationshipData;
      }
    }

    if (Array.isArray(actualValue)) {
      if (actualValue.length > 0 && typeof actualValue[0] === "object" && actualValue[0] !== null) {
        // Array of objects - extract IDs using the configured valueField
        selectedValues = actualValue.map((item) => item[config.valueField]);
      } else {
        // Array of primitives (IDs) - use as-is
        selectedValues = actualValue;
      }
    }

    // Determine if this entity type needs project scoping
    const needsProjectScoping = configKey === 'prosjektKrav' || configKey === 'prosjektTiltak';

    // Route to specialized components with inline creation support
    if (configKey === 'lov') {
      return (
        <LovCheckboxGroup
          selectedValues={selectedValues}
          onChange={(values) => {
            onChange({
              target: {
                name: field.name,
                value: values,
                type: "multiselect",
              },
            });
          }}
          disabled={disabled}
          placeholder={placeholder}
          config={config}
        />
      );
    }

    if (configKey === 'kravpakker') {
      return (
        <KravpakkerCheckboxGroup
          selectedValues={selectedValues}
          onChange={(values) => {
            onChange({
              target: {
                name: field.name,
                value: values,
                type: "multiselect",
              },
            });
          }}
          disabled={disabled}
          placeholder={placeholder}
          config={config}
        />
      );
    }

    // Default: use generic multiselect for other entity types
    return (
      <GenericMultiSelect
        selectedValues={selectedValues}
        onSelectionChange={(values) => {
          // Simple onChange handling for form state
          onChange({
            target: {
              name: field.name,
              value: values,
              type: "multiselect",
            },
          });
        }}
        disabled={disabled}
        className={field.className}
        apiEndpoint={config.apiEndpoint}
        valueField={config.valueField}
        labelField={config.labelField}
        customLabelFormatter={config.customLabelFormatter}
        descriptionField={config.descriptionField}
        placeholder={placeholder}
        searchPlaceholder={config.searchPlaceholder}
        emptyMessage={config.emptyMessage}
        loadingMessage={config.loadingMessage}
        projectId={needsProjectScoping ? projectId : undefined}
      />
    );
  },
};
