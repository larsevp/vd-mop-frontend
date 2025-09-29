import React, { useEffect, useRef } from "react";
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
    const isNewEntity = formData?.__isNew || row?.__isNew || data?.__isNew;
    const entityId = isNewEntity ? 'create-new' : (formData?.id || row?.id || data?.id);
    
    const { 
      inheritedEmne, 
      hasInheritance, 
      isFieldDisabled, 
      getDisabledPlaceholder,
      hasParentConnection,
      hasRelatedEntityConnection
    } = useEmneInheritance(entityType, entityId);

    // Track which entities we've already cleared to avoid repeated clearing
    const clearedEntitiesRef = useRef(new Set());
    // Track user interaction to prevent clearing after manual selections
    const userInteractionRef = useRef(false);

    // Apply inheritance when store updates (including blank/null values from connections)
    useEffect(() => {
      // If there's a parent or krav connection, always sync the emne value (even if null/blank)
      if ((hasParentConnection || hasRelatedEntityConnection) && value !== inheritedEmne) {
        onChange({ target: { name: field.name, value: inheritedEmne } });
      }
      // Legacy: also sync if there's an actual inherited emne value
      else if (inheritedEmne && value !== inheritedEmne) {
        onChange({ target: { name: field.name, value: inheritedEmne } });
      }
    }, [inheritedEmne, value, onChange, field.name, hasParentConnection, hasRelatedEntityConnection]);

    // Clear field value when switching to new entity with no inheritance
    useEffect(() => {
      const isNewEntity = entityId === 'create-new' || entityId?.toString().includes('create');

      // If this is a new entity and there's no inheritance, clear the field value
      if (isNewEntity && !inheritedEmne && !hasParentConnection && !hasRelatedEntityConnection && value) {
        onChange({ target: { name: field.name, value: null } });
      }
    }, [entityId, inheritedEmne, hasParentConnection, hasRelatedEntityConnection, value, onChange, field.name]);

    // Reset interaction flag when switching entities
    useEffect(() => {
      userInteractionRef.current = false;
    }, [entityId]);

    // Use inherited value if available, otherwise use form value
    const effectiveValue = inheritedEmne || value;
    const disabled = isFieldDisabled('emne');
    const placeholder = getDisabledPlaceholder('emne') || field.placeholder;

    // Wrap onChange to mark user interaction
    const handleChange = (event) => {
      userInteractionRef.current = true;
      onChange(event);
    };

    return (
      <EmneSelect
        name={field.name}
        value={effectiveValue}
        onChange={disabled ? () => {} : handleChange}
        label={field.label}
        required={disabled ? false : field.required}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
      />
    );
  },
};
