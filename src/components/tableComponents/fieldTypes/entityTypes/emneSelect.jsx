import React, { useEffect } from "react";
import { EmneSelect } from "../../../ui/form/EmneSelect";
import { useEmneInheritance } from "../../../../hooks/useEmneInheritance";

export const emneSelectType = {
  emneselect: ({ field, value, onChange, error, formData, form, row, data, modelName }) => {
    // Determine entity type from context - use modelName to determine the correct entity type
    const getEntityTypeFromModel = (modelName) => {
      switch (modelName) {
        case 'krav':
          return 'krav';
        case 'prosjektKrav':
          return 'prosjektKrav';
        case 'prosjektTiltak':
          return 'prosjektTiltak';
        case 'tiltak':
        default:
          return 'tiltak';
      }
    };
    
    const entityType = getEntityTypeFromModel(modelName);
    
    // Get entity ID from formData, row, or data for proper inheritance tracking
    const entityId = formData?.id || row?.id || data?.id || 'create-new';
    
    const { 
      inheritedEmne, 
      hasInheritance, 
      isFieldDisabled, 
      getDisabledPlaceholder 
    } = useEmneInheritance(entityType, entityId);

    // Apply inheritance when store updates
    useEffect(() => {
      if (inheritedEmne && value !== inheritedEmne) {
        onChange({ target: { name: field.name, value: inheritedEmne } });
      }
    }, [inheritedEmne, value, onChange, field.name]);

    // Use inherited value if available, otherwise use form value
    const effectiveValue = inheritedEmne || value;
    const disabled = isFieldDisabled('emne');
    const placeholder = getDisabledPlaceholder('emne') || field.placeholder;

    return (
      <EmneSelect
        name={field.name}
        value={effectiveValue}
        onChange={disabled ? () => {} : onChange}
        label={field.label}
        required={disabled ? false : field.required}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
      />
    );
  },
};
