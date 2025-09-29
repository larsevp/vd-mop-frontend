import React from "react";
import GenericMultiSelect from "../../../ui/form/GenericMultiSelect";
import { MULTISELECT_ENTITY_CONFIG } from "./config";
import { useEmneInheritance } from "../../../../hooks/useEmneInheritance";
import { useProjectStore } from "../../../../stores/userStore";

// Generic multiselect for entity relationships
export const multiselectType = {
  multiselect: ({ field, value, onChange, error, entityType, formData, form, row, data, setFormData }) => {
    // Get configuration for this multiselect type (check both multiselectType and entityType)
    //console.log(field);
    const configKey = field.multiselectType || field.entityType;
    const config = MULTISELECT_ENTITY_CONFIG[configKey];
    if (!config) {
      console.error(`No configuration found for multiselect type: ${configKey}`);
      return null;
    }

    // Get project context for project-scoped entities
    const { currentProject } = useProjectStore();
    const projectId = currentProject?.id;

    // Determine the CURRENT entity type (not the selected entity type)
    // We need to infer what type of entity is doing the selecting based on what it's selecting
    // IMPORTANT: Stabilize the entity type to prevent hook consistency errors
    const inheritanceEntityType = React.useMemo(() => {
      // Map selected entity types to current entity types
      if (configKey === 'prosjektKrav' || field.name === 'prosjektKrav') {
        return 'prosjektTiltak'; // If selecting prosjektKrav, current entity is prosjektTiltak
      }
      if (configKey === 'krav' || field.name === 'krav') {
        return 'tiltak'; // If selecting krav, current entity is tiltak
      }

      // If we're in a project context (based on configKey or field name), use project entities
      const isProjectContext = configKey === 'prosjektKrav' || configKey === 'prosjektTiltak' ||
                               field.name === 'prosjektKrav' || field.name === 'prosjektTiltak';

      return isProjectContext ? 'prosjektTiltak' : 'tiltak';
    }, [configKey, field.name]);

    // Get entity ID for proper inheritance tracking (same logic as emneSelect)
    const isNewEntity = formData?.__isNew || row?.__isNew || data?.__isNew;
    const entityId = isNewEntity ? 'create-new' : (formData?.id || row?.id || data?.id);

    // Use the inheritance hook for mutual exclusivity and inheritance logic
    const {
      handleRelatedEntitySelection,
      isFieldDisabled,
      getDisabledPlaceholder,
      hasParentConnection,
      hasRelatedEntityConnection
    } = useEmneInheritance(inheritanceEntityType, entityId);
    
    // Store API data for emne inheritance logic
    const [apiData, setApiData] = React.useState([]);

    // Get disabled state and placeholder from the store based on actual field type
    const fieldType = field.name === 'prosjektKrav' ? 'prosjektKrav' : 'krav';
    const disabled = isFieldDisabled(fieldType) || field.disabled;
    const placeholder = getDisabledPlaceholder(fieldType) || field.placeholder || config.placeholder;

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

    // Initialize store when component mounts with existing selected values
    React.useEffect(() => {
      if (selectedValues.length > 0 && apiData.length > 0) {
        const relatedType = field.name === "prosjektKrav" ? "prosjektKrav" : "krav";
        // Initialize store with existing selections
        handleRelatedEntitySelection(selectedValues, apiData, relatedType);
      }
    }, [selectedValues.length, apiData.length, handleRelatedEntitySelection, field.name]);

    // Determine if this entity type needs project scoping
    const needsProjectScoping = configKey === 'prosjektKrav' || configKey === 'prosjektTiltak';

    return (
      <GenericMultiSelect
        selectedValues={selectedValues}
        onDataLoaded={setApiData} // Store API data for emne inheritance
        onSelectionChange={(values) => {
          // Handle inheritance and mutual exclusivity via the store
          const relatedType = field.name === "prosjektKrav" ? "prosjektKrav" : "krav";

          // Use the store to handle inheritance and mutual exclusivity
          handleRelatedEntitySelection(values, apiData, relatedType);

          // Standard onChange handling for form state
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
